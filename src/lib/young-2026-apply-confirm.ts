import { YOUNG_2026 } from "@/lib/young-2026";

/** sessionStorage キー（確認ページ用） */
export const YOUNG_2026_APPLY_STORAGE_KEY = "young2026_apply_confirm_v1";

export type Young2026ApplyConfirmPayload = {
  competitionId: string;
  name: string;
  furigana: string;
  email: string;
  birth_date: string;
  member_type: "会員" | "非会員" | "同時入会";
  member_number?: string;
  category: string;
  selected_piece_preliminary?: string | null;
  selected_piece_final?: string | null;
  video_url?: string | null;
  accompanist_info?: string | null;
};

export function saveYoung2026ApplyConfirmPayload(data: Young2026ApplyConfirmPayload): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(YOUNG_2026_APPLY_STORAGE_KEY, JSON.stringify(data));
}

export function loadYoung2026ApplyConfirmPayload(): Young2026ApplyConfirmPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(YOUNG_2026_APPLY_STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== "object") return null;
    const p = o as Record<string, unknown>;
    if (typeof p.competitionId !== "string" || typeof p.name !== "string" || typeof p.email !== "string") {
      return null;
    }
    return o as Young2026ApplyConfirmPayload;
  } catch {
    return null;
  }
}

export function clearYoung2026ApplyConfirmPayload(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(YOUNG_2026_APPLY_STORAGE_KEY);
}

/** 参加費（円）。未選択などで算定できないときは null */
export function young2026ApplyFeeYen(
  category: string,
  memberType: string
): number | null {
  if (!category?.trim() || !memberType?.trim()) return null;
  if (memberType === "同時入会") {
    const c = category as keyof typeof YOUNG_2026.fees;
    return (YOUNG_2026.fees[c]?.非会員 ?? 10000) + YOUNG_2026.firstYearMembershipFee;
  }
  const c = category as keyof typeof YOUNG_2026.fees;
  const fees = YOUNG_2026.fees[c];
  if (!fees) return null;
  if (memberType === "会員") return fees.会員;
  if (memberType === "非会員") return fees.非会員;
  return null;
}

export function young2026CategoryLabel(categoryId: string): string {
  const c = YOUNG_2026.eligibility.categories.find((x) => x.id === categoryId);
  return c?.label ?? categoryId;
}

const VALID_MEMBER_TYPES = ["会員", "非会員", "同時入会"] as const;
const VALID_CATEGORIES = ["ジュニアA", "ジュニアB", "ヤング"] as const;

/** ストレージの JSON がフォームに流し込み可能かざっと検証する */
export function isRestorableYoung2026ApplyPayload(
  p: Young2026ApplyConfirmPayload
): p is Young2026ApplyConfirmPayload & {
  member_type: (typeof VALID_MEMBER_TYPES)[number];
  category: (typeof VALID_CATEGORIES)[number];
} {
  return (
    VALID_MEMBER_TYPES.includes(p.member_type as (typeof VALID_MEMBER_TYPES)[number]) &&
    VALID_CATEGORIES.includes(p.category as (typeof VALID_CATEGORIES)[number]) &&
    typeof p.birth_date === "string" &&
    p.birth_date.length > 0 &&
    typeof p.furigana === "string"
  );
}
