import type { SupabaseClient } from "@supabase/supabase-js";
import { ENSEMBLE_2027, isEnsemble2027ApplicationOpen } from "@/lib/ensemble-2027";
import { isCurrentUserAdmin } from "@/lib/is-current-user-admin";
import { createAdminClient } from "@/lib/supabase/server";
import { YOUNG_2026, isYoung2026ApplicationOpen } from "@/lib/young-2026";

export type CompetitionGateSlug =
  | typeof YOUNG_2026.slug
  | typeof ENSEMBLE_2027.slug;

export function parseCompetitionGateSlug(
  raw: string | null | undefined
): CompetitionGateSlug | null {
  if (raw === YOUNG_2026.slug || raw === ENSEMBLE_2027.slug) return raw;
  return null;
}

export function isPeriodOpenForSlug(slug: CompetitionGateSlug, now = new Date()): boolean {
  if (slug === YOUNG_2026.slug) return isYoung2026ApplicationOpen(now);
  return isEnsemble2027ApplicationOpen(now);
}

function competitionSeedRow(slug: CompetitionGateSlug) {
  if (slug === ENSEMBLE_2027.slug) {
    return {
      slug: ENSEMBLE_2027.slug,
      name: ENSEMBLE_2027.name,
      year: ENSEMBLE_2027.year,
      reference_date: "2027-01-01",
      category_options: ENSEMBLE_2027.categories.map((c) => c.id),
      is_active: true,
    };
  }
  return {
    slug: YOUNG_2026.slug,
    name: YOUNG_2026.name,
    year: 2026,
    reference_date: YOUNG_2026.referenceDate,
    category_options: YOUNG_2026.eligibility.categories.map((c) => c.id),
    is_active: true,
  };
}

/** competitions 行を取得。管理者テスト時のみ未登録なら upsert する */
export async function resolveCompetitionId(
  db: SupabaseClient,
  slug: CompetitionGateSlug,
  seedIfAdmin: boolean
): Promise<string | null> {
  const { data: existing } = await db
    .from("competitions")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing?.id) return existing.id;
  if (!seedIfAdmin) return null;

  const { data: upserted, error } = await db
    .from("competitions")
    .upsert(competitionSeedRow(slug), { onConflict: "slug" })
    .select("id")
    .single();

  if (error || !upserted?.id) return null;
  return upserted.id as string;
}

export async function getCompetitionApplicationGate(slug: CompetitionGateSlug) {
  const isAdmin = await isCurrentUserAdmin();
  const periodOpen = isPeriodOpenForSlug(slug);
  const db = createAdminClient();
  const competitionId = await resolveCompetitionId(db, slug, isAdmin);

  return {
    competitionId,
    periodOpen,
    isAdmin,
    applicationOpen: periodOpen || isAdmin,
    adminTestMode: isAdmin && !periodOpen,
  };
}
