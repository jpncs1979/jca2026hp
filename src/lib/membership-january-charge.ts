import { fiscalYearForDate } from "@/lib/membership-fiscal-year";

/**
 * 年会費のカード自動引き落とし（JST）の実行日。
 * Stripe の振込が概ね T+2 営業日となるため、1/31 までの協会口座着金の余裕を見て 22 日に設定。
 */
export const MEMBERSHIP_AUTO_CHARGE_DAY_OF_MONTH_JST = 22;

/** 1月の自動請求で徴収する会費の対象「事業年度」の開始年（その年の 2/1 からの年度） */
export function targetFiscalYearJanuaryCardCharge(jstDate: Date): number {
  return fiscalYearForDate(jstDate) + 1;
}
