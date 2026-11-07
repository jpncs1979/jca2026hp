import { createAdminClient } from "@/lib/supabase/server";
import type { SupportedConcert } from "@/data/supported-concerts";
import {
  formatConcertDateLabel,
  isPdfFlyer,
  patronageFlyerHref,
  patronageFlyerPreviewHref,
  PATRONAGE_SELECT_COLS,
  todayInTokyo,
  type PatronageConcertRow,
} from "@/lib/patronage-concerts";

export function toSupportedConcert(row: PatronageConcertRow): SupportedConcert {
  const flyerIsPdf = isPdfFlyer(row.flyer_content_type, row.flyer_filename);
  const flyerUrl = row.flyer_path ? patronageFlyerHref(row.id, row.updated_at) : null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.concert_title,
    dateLabel: formatConcertDateLabel(row.event_date),
    date: row.event_date,
    time: `開場 ${row.doors_open}　開演 ${row.curtain_time}`,
    venue: row.venue,
    price: row.admission,
    performers: row.performers,
    program: row.program,
    organizer: row.organizer,
    contact: row.contact,
    addedDate: (row.approved_at ?? row.created_at).slice(0, 10),
    flyerUrl,
    // PDF は1ページ目を画像にしたもの、画像はそのまま
    flyerImageUrl:
      flyerUrl && flyerIsPdf ? patronageFlyerPreviewHref(row.id, row.updated_at) : flyerUrl,
    flyerIsPdf,
  };
}

export async function getApprovedUpcomingConcerts(): Promise<SupportedConcert[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("patronage_concerts")
      .select(PATRONAGE_SELECT_COLS)
      .eq("status", "approved")
      .gte("event_date", todayInTokyo())
      .order("event_date", { ascending: true });
    if (error) {
      console.error("[patronage_concerts] list", error);
      return [];
    }
    return ((data ?? []) as PatronageConcertRow[]).map(toSupportedConcert);
  } catch (err) {
    console.error("[patronage_concerts] list", err);
    return [];
  }
}

export async function getApprovedConcertBySlug(
  slug: string
): Promise<SupportedConcert | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("patronage_concerts")
      .select(PATRONAGE_SELECT_COLS)
      .eq("slug", slug)
      .eq("status", "approved")
      .maybeSingle();
    if (error || !data) return null;
    return toSupportedConcert(data as PatronageConcertRow);
  } catch (err) {
    console.error("[patronage_concerts] by slug", err);
    return null;
  }
}
