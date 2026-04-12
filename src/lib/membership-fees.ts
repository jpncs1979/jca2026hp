/**
 * 協会会費・入会金
 * 決済をもって即時入会とする。
 */
import { fiscalYearForDate } from "@/lib/membership-fiscal-year";

export const ENTRANCE_FEE = 2000; // 入会金
export const REGULAR_ANNUAL = 8000; // 正会員年間会費
export const STUDENT_ANNUAL = 6000; // 学生会員年間会費
/** 賛助会員 1口あたりの年間会費（マイページのカード決済用・簡易1口） */
export const SUPPORTING_ANNUAL_PER_UNIT = 15000;

export type MembershipTypeForFee = "regular" | "student";

/**
 * 入会時にカバーする会費の対象年度（事業年度の開始年）の一覧
 * - 2〜10月入会: 当該年度のみ
 * - 11・12・1月入会: 翌年度のみ（入会金＋翌年度会費）
 */
export function joinMembershipFeeFiscalYears(joinDate: Date): number[] {
  const m = joinDate.getMonth() + 1;
  const fyHere = fiscalYearForDate(joinDate);
  if (m === 11 || m === 12 || m === 1) {
    return [fyHere + 1];
  }
  return [fyHere];
}

/**
 * 入会時の初回決済額（円）
 * - 2〜10月入会: 入会金＋当該年度会費
 * - 11・12・1月入会: 入会金＋翌年度会費
 */
/** 年会費のみ（更新・マイページ決済用） */
export function getAnnualMembershipFeeYen(membershipType: string | null | undefined): number {
  if (membershipType === "student") return STUDENT_ANNUAL;
  if (membershipType === "supporting") return SUPPORTING_ANNUAL_PER_UNIT;
  return REGULAR_ANNUAL;
}

export function getMembershipJoinAmount(
  membershipType: MembershipTypeForFee,
  joinDate: Date
): number {
  const annual = membershipType === "student" ? STUDENT_ANNUAL : REGULAR_ANNUAL;
  const years = joinMembershipFeeFiscalYears(joinDate);
  return ENTRANCE_FEE + annual * years.length;
}
