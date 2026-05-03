import { fiscalYearForDate } from "@/lib/membership-fiscal-year";
import {
  isUnpaidForMembershipFiscalYear,
  type PaymentRowForFee,
} from "@/lib/membership-fee-status";

/** DB の expulsion_reason と一致 */
export const EXPEL_REASON_THREE_YEAR_ARREARS = "three_year_arrears" as const;

/**
 * 有効会員として、直近3事業年度（基準日の年度・その前年・前々年）がいずれも会費未納で、
 * かつ入会が「前々年度」の開始以前から続いている場合に true（3年連続未納とみなす）。
 */
export function shouldExpelActiveMemberForThreeConsecutiveUnpaidFiscalYears(
  joinDateStr: string | null | undefined,
  payments: PaymentRowForFee[],
  latestExpiryDate: string | null | undefined,
  refDate: Date = new Date()
): boolean {
  if (!joinDateStr?.trim()) return false;
  const join = new Date(joinDateStr.trim());
  if (Number.isNaN(join.getTime())) return false;
  const joinFy = fiscalYearForDate(join);
  const currentFy = fiscalYearForDate(refDate);
  const oldestOfWindow = currentFy - 2;
  if (joinFy > oldestOfWindow) return false;
  return (
    isUnpaidForMembershipFiscalYear(payments, latestExpiryDate, currentFy) &&
    isUnpaidForMembershipFiscalYear(payments, latestExpiryDate, currentFy - 1) &&
    isUnpaidForMembershipFiscalYear(payments, latestExpiryDate, oldestOfWindow)
  );
}
