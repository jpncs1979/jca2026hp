export const PATRONAGE_FLYER_BUCKET = "patronage-flyers";
export const PATRONAGE_FLYER_MAX_BYTES = 4 * 1024 * 1024;

export const PATRONAGE_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "unpublished",
] as const;

export type PatronageConcertStatus = (typeof PATRONAGE_STATUSES)[number];

export type PatronageConcertRow = {
  id: string;
  slug: string;
  applicant_name: string;
  applicant_email: string;
  member_number: string | null;
  concert_title: string;
  event_date: string;
  doors_open: string;
  curtain_time: string;
  venue: string;
  admission: string;
  performers: string;
  program: string;
  organizer: string;
  contact: string;
  consent_destination: string;
  notes: string | null;
  flyer_path: string | null;
  flyer_content_type: string | null;
  flyer_filename: string | null;
  status: PatronageConcertStatus;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export const PATRONAGE_SELECT_COLS =
  "id, slug, applicant_name, applicant_email, member_number, concert_title, event_date, doors_open, curtain_time, venue, admission, performers, program, organizer, contact, consent_destination, notes, flyer_path, flyer_content_type, flyer_filename, status, approved_at, created_at, updated_at";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function formatConcertDateLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  const date = new Date(y, m - 1, d);
  return `${y}年${m}月${d}日（${WEEKDAYS[date.getDay()]}）`;
}

export function todayInTokyo(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
}

export function patronageFlyerHref(id: string): string {
  return `/api/patronage-concerts/${id}/flyer`;
}

export function isPdfFlyer(contentType: string | null, filename: string | null): boolean {
  if (contentType?.includes("pdf")) return true;
  return (filename ?? "").toLowerCase().endsWith(".pdf");
}

export function flyerExtension(filename: string, contentType: string): string | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf") || contentType === "application/pdf") return "pdf";
  if (lower.endsWith(".png") || contentType === "image/png") return "png";
  if (lower.endsWith(".webp") || contentType === "image/webp") return "webp";
  if (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    contentType === "image/jpeg"
  ) {
    return "jpg";
  }
  return null;
}
