import { fetchMembershipFeePaymentsByProfileIds } from "@/lib/admin-members-unpaid-filter";
import {
  computeMemberKindDisplay,
  isThreeYearConsecutiveUnpaid,
  type MemberKindDisplay,
  type MemberKindInput,
} from "@/lib/member-display-status";
import type { PaymentRowForFee } from "@/lib/membership-fee-status";

export type MemberKindFilter = "" | MemberKindDisplay | "three_year_unpaid";

export async function attachMemberKindToProfiles<
  T extends MemberKindInput & { id: string },
>(admin: Parameters<typeof fetchMembershipFeePaymentsByProfileIds>[0], profiles: T[]) {
  const ids = profiles.map((p) => p.id);
  const paymentsByProfile = await fetchMembershipFeePaymentsByProfileIds(admin, ids);
  const refDate = new Date();

  return profiles.map((p) => {
    const payments = paymentsByProfile.get(p.id) ?? [];
    return {
      ...p,
      member_kind: computeMemberKindDisplay(p, payments, refDate),
      three_year_consecutive_unpaid: isThreeYearConsecutiveUnpaid(p, payments, refDate),
    };
  });
}

export function filterProfilesForAdminList<
  T extends { member_kind: MemberKindDisplay; membership_type: string },
>(
  profiles: T[],
  typeFilter: "" | "regular" | "student" | "supporting" | "friend" | "non_member",
  unpaidOnly: boolean
): T[] {
  let list = profiles;
  if (typeFilter === "non_member") {
    list = list.filter((p) => p.member_kind === "非会員");
  } else if (typeFilter) {
    list = list.filter(
      (p) => p.member_kind !== "非会員" && p.membership_type === typeFilter
    );
  }
  if (unpaidOnly) {
    list = list.filter((p) => p.member_kind === "未納あり");
  }
  return list;
}

export function filterProfilesByMemberKind<
  T extends { member_kind: MemberKindDisplay; three_year_consecutive_unpaid?: boolean },
>(profiles: T[], kind: MemberKindFilter): T[] {
  if (!kind) return profiles;
  if (kind === "three_year_unpaid") {
    return profiles.filter((p) => p.three_year_consecutive_unpaid);
  }
  return profiles.filter((p) => p.member_kind === kind);
}

export type ProfileWithMemberKind = MemberKindInput & {
  id: string;
  member_kind: MemberKindDisplay;
  three_year_consecutive_unpaid: boolean;
};

export function getPaymentsForProfile(
  map: Map<string, PaymentRowForFee[]>,
  id: string
): PaymentRowForFee[] {
  return map.get(id) ?? [];
}
