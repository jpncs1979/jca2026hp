/**
 * 協会会費・入会金
 * 決済をもって即時入会とする。
 */
export const ENTRANCE_FEE = 2000; // 入会金
export const REGULAR_ANNUAL = 8000; // 正会員年間会費
export const STUDENT_ANNUAL = 6000; // 学生会員年間会費

export type MembershipTypeForFee = "regular" | "student";

/**
 * 入会時の初回決済額（円）
 * - 1〜9月入会: 入会金＋当該年度会費
 * - 10〜12月入会（案B）: 入会金＋当該年度会費＋翌年度会費
 */
export function getMembershipJoinAmount(
  membershipType: MembershipTypeForFee,
  joinDate: Date
): number {
  const annual = membershipType === "student" ? STUDENT_ANNUAL : REGULAR_ANNUAL;
  const month = joinDate.getMonth() + 1; // 1-12
  if (month >= 10) {
    return ENTRANCE_FEE + annual + annual;
  }
  return ENTRANCE_FEE + annual;
}
