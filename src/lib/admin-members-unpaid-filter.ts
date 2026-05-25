import {
  hasUnpaidInRecentFiscalYearsByPaymentOnly,
  isUnpaidForMembershipFiscalYearByPaymentOnly,
  type PaymentRowForFee,
} from "@/lib/membership-fee-status";

export const UNPAID_FILTER_MODE_RECENT3 = "recent3" as const;
export const UNPAID_FILTER_MODE_EXPIRY = "expiry" as const;

export type MembershipRowForUnpaid = {
  join_date?: string;
  expiry_date?: string;
};

export type ProfileForUnpaidFilter = {
  id: string;
  memberships?: MembershipRowForUnpaid[] | null;
};

export function getLatestMembershipForUnpaid(
  memberships: MembershipRowForUnpaid[] | null | undefined
): MembershipRowForUnpaid | undefined {
  const arr = memberships ?? [];
  return [...arr].sort((a, b) =>
    (b.expiry_date ?? "").localeCompare(a.expiry_date ?? "")
  )[0];
}

export function profileMatchesUnpaidFilter(
  profile: ProfileForUnpaidFilter,
  payments: PaymentRowForFee[],
  mode: string
): boolean {
  const latest = getLatestMembershipForUnpaid(profile.memberships);
  const joinDate = latest?.join_date ?? null;

  if (mode === UNPAID_FILTER_MODE_EXPIRY) {
    const today = new Date().toISOString().slice(0, 10);
    const exp = latest?.expiry_date;
    return !exp || exp < today;
  }

  if (mode === UNPAID_FILTER_MODE_RECENT3 || !mode) {
    return hasUnpaidInRecentFiscalYearsByPaymentOnly(payments, joinDate, 3);
  }

  const fy = parseInt(mode, 10);
  if (Number.isFinite(fy)) {
    return isUnpaidForMembershipFiscalYearByPaymentOnly(payments, joinDate, fy);
  }

  return hasUnpaidInRecentFiscalYearsByPaymentOnly(payments, joinDate, 3);
}

export async function fetchMembershipFeePaymentsByProfileIds(
  admin: {
    from: (table: string) => {
      select: (cols: string) => {
        in: (
          col: string,
          vals: string[]
        ) => {
          eq: (
            col: string,
            val: string
          ) => Promise<{ data: unknown[] | null }>;
        };
      };
    };
  },
  profileIds: string[]
): Promise<Map<string, PaymentRowForFee[]>> {
  const paymentsByProfile = new Map<string, PaymentRowForFee[]>();
  const chunkSize = 150;
  for (let i = 0; i < profileIds.length; i += chunkSize) {
    const chunk = profileIds.slice(i, i + chunkSize);
    if (chunk.length === 0) break;
    const { data: payChunk } = await admin
      .from("payments")
      .select(
        "profile_id, purpose, method, metadata, created_at, membership_fiscal_year"
      )
      .in("profile_id", chunk)
      .eq("purpose", "membership_fee");
    for (const row of payChunk ?? []) {
      const pid = (row as { profile_id: string }).profile_id;
      if (!paymentsByProfile.has(pid)) paymentsByProfile.set(pid, []);
      paymentsByProfile.get(pid)!.push(row as PaymentRowForFee);
    }
  }
  return paymentsByProfile;
}

export function filterProfilesByUnpaidMode<T extends ProfileForUnpaidFilter>(
  profiles: T[],
  paymentsByProfile: Map<string, PaymentRowForFee[]>,
  mode: string
): T[] {
  return profiles.filter((p) =>
    profileMatchesUnpaidFilter(p, paymentsByProfile.get(p.id) ?? [], mode)
  );
}
