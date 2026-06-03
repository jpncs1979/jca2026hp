import { ENSEMBLE_2027, type Ensemble2027CategoryId } from "@/lib/ensemble-2027";

export const ENSEMBLE_2027_APPLY_STORAGE_KEY = "ensemble2027_apply_confirm_v1";

export type Ensemble2027ApplyConfirmPayload = {
  competitionId: string;
  name: string;
  furigana: string;
  email: string;
  birth_date: string;
  member_type: "会員" | "非会員";
  member_number?: string;
  category: Ensemble2027CategoryId;
  representative_name: string;
  phone: string;
  program_title: string;
  ensemble_details: string;
  video_url?: string | null;
};

export function saveEnsemble2027ApplyConfirmPayload(data: Ensemble2027ApplyConfirmPayload): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ENSEMBLE_2027_APPLY_STORAGE_KEY, JSON.stringify(data));
}

export function loadEnsemble2027ApplyConfirmPayload(): Ensemble2027ApplyConfirmPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ENSEMBLE_2027_APPLY_STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== "object") return null;
    const p = o as Record<string, unknown>;
    if (typeof p.competitionId !== "string" || typeof p.name !== "string" || typeof p.email !== "string") {
      return null;
    }
    return o as Ensemble2027ApplyConfirmPayload;
  } catch {
    return null;
  }
}

export function clearEnsemble2027ApplyConfirmPayload(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ENSEMBLE_2027_APPLY_STORAGE_KEY);
}

export function ensemble2027ApplyFeeYen(
  category: string,
  memberType: string
): number | null {
  if (!category?.trim() || !memberType?.trim()) return null;
  const fees = ENSEMBLE_2027.fees[category as Ensemble2027CategoryId];
  if (!fees) return null;
  if (memberType === "会員") return fees.会員;
  if (memberType === "非会員") return fees.非会員;
  return null;
}

export function ensemble2027CategoryLabel(categoryId: string): string {
  const c = ENSEMBLE_2027.categories.find((x) => x.id === categoryId);
  return c?.label ?? categoryId;
}

const VALID_MEMBER_TYPES = ["会員", "非会員"] as const;
const VALID_CATEGORIES = ENSEMBLE_2027.categories.map((c) => c.id);

export function isRestorableEnsemble2027ApplyPayload(
  p: Ensemble2027ApplyConfirmPayload
): p is Ensemble2027ApplyConfirmPayload & {
  member_type: (typeof VALID_MEMBER_TYPES)[number];
  category: Ensemble2027CategoryId;
} {
  return (
    VALID_MEMBER_TYPES.includes(p.member_type as (typeof VALID_MEMBER_TYPES)[number]) &&
    VALID_CATEGORIES.includes(p.category as Ensemble2027CategoryId) &&
    typeof p.birth_date === "string" &&
    p.birth_date.length > 0 &&
    typeof p.furigana === "string" &&
    typeof p.representative_name === "string" &&
    typeof p.phone === "string" &&
    typeof p.program_title === "string" &&
    typeof p.ensemble_details === "string"
  );
}
