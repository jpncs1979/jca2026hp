/** 銀行振込フロー: 申込直後の表示用（sessionStorage） */
export const YOUNG_2026_BANK_DRAFT_KEY = "young2026_bank_draft_v1";

export type Young2026BankDraft = {
  applicationId: string;
  email: string;
  name: string;
  amount: number;
};

export function saveYoung2026BankDraft(data: Young2026BankDraft): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(YOUNG_2026_BANK_DRAFT_KEY, JSON.stringify(data));
}

export function loadYoung2026BankDraft(): Young2026BankDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(YOUNG_2026_BANK_DRAFT_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== "object") return null;
    const p = o as Record<string, unknown>;
    if (
      typeof p.applicationId !== "string" ||
      typeof p.email !== "string" ||
      typeof p.name !== "string" ||
      typeof p.amount !== "number"
    ) {
      return null;
    }
    return {
      applicationId: p.applicationId,
      email: p.email,
      name: p.name,
      amount: p.amount,
    };
  } catch {
    return null;
  }
}

export function clearYoung2026BankDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(YOUNG_2026_BANK_DRAFT_KEY);
}
