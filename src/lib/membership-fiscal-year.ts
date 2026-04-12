/**
 * 会費の「事業年度」は 2月1日〜翌年1月31日 を「N年度」（開始年 N）とする。
 * （例: 2026年度 = 2026-02-01 〜 2027-01-31）
 */
export function fiscalYearForDate(d: Date): number {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  if (m >= 2) return y;
  return y - 1;
}

/** N年度の開始日（含む）ISO 日付 */
export function fiscalYearStartIso(fy: number): string {
  return `${fy}-02-01`;
}

/** 事業年度 N 年度の終了日（含む）ISO 日付（翌年1/31） */
export function fiscalYearEndIso(fy: number): string {
  return `${fy + 1}-01-31`;
}

/**
 * 会員資格の末日（会員年度は 4/1〜翌3/31）。
 * 事業年度（会費の対象）の開始年が maxPaidBusinessFy の年度分まで支払済みのとき、
 * 資格はその範囲に対応する会員年度の末日 = (maxPaidBusinessFy + 1)年 3/31。
 * 例: 事業2026年度の会費のみ → 2027-03-31（2026/4/1〜2027/3/31 が会員としての期間）
 */
export function membershipEligibilityEndIsoFromMaxPaidBusinessFiscalYear(
  maxPaidBusinessFy: number
): string {
  return `${maxPaidBusinessFy + 1}-03-31`;
}

/** N年度の表記 */
export function formatFiscalYearLabel(fy: number): string {
  return `${fy}年度`;
}

/** 基準日を含む年度から過去へ count 件（新しい順） */
export function recentFiscalYears(count: number, ref: Date = new Date()): number[] {
  const current = fiscalYearForDate(ref);
  return Array.from({ length: count }, (_, i) => current - i);
}
