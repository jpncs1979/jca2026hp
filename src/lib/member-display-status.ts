/**
 * 管理画面・会費状況CSV用の会員区分（DB status とは別の表示用）
 */

import { shouldExpelActiveMemberForThreeConsecutiveUnpaidFiscalYears } from "@/lib/membership-three-year-arrears";
import {
  hasUnpaidInRecentFiscalYearsByPaymentOnly,
  type PaymentRowForFee,
} from "@/lib/membership-fee-status";

export type MemberKindDisplay = "会員" | "非会員" | "未納あり";

export type MemberKindInput = {
  status: string;
  memberships?: { join_date?: string; expiry_date?: string }[] | null;
  membership_valid_until?: string | null;
};

function latestExpiry(m: MemberKindInput): string | null {
  const fromProfile = m.membership_valid_until?.trim();
  if (fromProfile) return fromProfile;
  const arr = m.memberships ?? [];
  const latest = [...arr].sort((a, b) =>
    (b.expiry_date ?? "").localeCompare(a.expiry_date ?? "")
  )[0];
  return latest?.expiry_date?.trim() ?? null;
}

function latestJoin(m: MemberKindInput): string | null {
  const arr = m.memberships ?? [];
  const latest = [...arr].sort((a, b) =>
    (b.expiry_date ?? "").localeCompare(a.expiry_date ?? "")
  )[0];
  return latest?.join_date?.trim() ?? null;
}

function ymdJst(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
}

/** 現在有効な会員資格があるか（active かつ資格末日が今日以降） */
export function hasActiveMembershipTerm(m: MemberKindInput, ref = new Date()): boolean {
  const st = m.status?.trim();
  if (st !== "active" && st !== "pending") return false;
  const exp = latestExpiry(m);
  if (!exp) return st === "active";
  return exp >= ymdJst(ref);
}

/** 会費入金記録が1件以上あるか */
export function hasAnyMembershipFeePayment(payments: PaymentRowForFee[]): boolean {
  return payments.some((p) => p.purpose === "membership_fee");
}

/**
 * 会員区分
 * - 非会員: 退会済み（expired）・強制退会記録（expelled）・資格期限切れ
 * - 未納あり: 有効資格があるが直近3事業年度のいずれかが未納（入金記録ベース）
 * - 会員: 有効資格があり未納なし（会費の支払い記録がある想定）
 */
export function computeMemberKindDisplay(
  m: MemberKindInput,
  payments: PaymentRowForFee[],
  refDate = new Date()
): MemberKindDisplay {
  const st = m.status?.trim();
  if (st === "expired" || st === "expelled") return "非会員";
  if (!hasActiveMembershipTerm(m, refDate)) return "非会員";

  const join = latestJoin(m);
  if (hasUnpaidInRecentFiscalYearsByPaymentOnly(payments, join, 3, refDate)) {
    return "未納あり";
  }
  if (!hasAnyMembershipFeePayment(payments)) return "未納あり";
  return "会員";
}

/** 3年連続未納（退会検討用・Excel確認） */
export function isThreeYearConsecutiveUnpaid(
  m: MemberKindInput,
  payments: PaymentRowForFee[],
  refDate = new Date()
): boolean {
  if (m.status !== "active" && m.status !== "pending") return false;
  return shouldExpelActiveMemberForThreeConsecutiveUnpaidFiscalYears(
    latestJoin(m),
    payments,
    latestExpiry(m),
    refDate
  );
}

export const MEMBER_KIND_LABELS: Record<MemberKindDisplay, string> = {
  会員: "会員",
  非会員: "非会員",
  未納あり: "未納あり",
};
