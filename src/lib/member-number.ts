/**
 * 会員番号（DB は整数）の表示・CSV 用 4 桁ゼロ埋め（例: 0001）。
 */
export function formatMemberNumber(
  n: number | null | undefined,
  whenNull = "－"
): string {
  if (n == null || Number.isNaN(Number(n))) return whenNull;
  const v = Math.max(0, Math.floor(Number(n)));
  return String(v).padStart(4, "0");
}

/** CSV 等の「0001」形式から整数へ（数字以外は除去） */
export function parseMemberNumberCell(s: string | null | undefined): number | null {
  const digits = String(s ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const v = parseInt(digits, 10);
  if (Number.isNaN(v) || v < 0) return null;
  return v;
}

/** フォームの会員番号入力を保存・メール用の 4 桁へ。空・解釈不能なら null */
export function normalizeMemberNumberInput(s: string | null | undefined): string | null {
  const t = String(s ?? "").trim();
  if (!t) return null;
  const v = parseMemberNumberCell(t);
  if (v == null) return null;
  return formatMemberNumber(v, "");
}
