import {
  fiscalYearEndIso,
  fiscalYearForDate,
  formatFiscalYearLabel,
  recentFiscalYears,
} from "@/lib/membership-fiscal-year";

export type MembershipFeeDisplayStatus = "決済済み" | "支払い済み" | "未払い";

export type MembershipFeeYearRow = {
  fiscal_year: number;
  label: string;
  status: MembershipFeeDisplayStatus;
};

export type PaymentRowForFee = {
  purpose: string;
  method?: string | null;
  membership_fiscal_year?: number | null;
  metadata?: unknown;
  created_at: string;
};

function parseMetadata(meta: unknown): Record<string, unknown> | null {
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return meta as Record<string, unknown>;
  }
  return null;
}

/** 当該 payment が年度 fy の会費をカバーするか */
export function paymentCoversFiscalYear(p: PaymentRowForFee, fy: number): boolean {
  if (p.purpose !== "membership_fee") return false;
  if (p.membership_fiscal_year === fy) return true;
  const meta = parseMetadata(p.metadata);
  if (meta?.fiscal_years && typeof meta.fiscal_years === "string") {
    const parts = meta.fiscal_years
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n));
    if (parts.includes(fy)) return true;
  }
  if (meta?.fiscal_year != null) {
    const n =
      typeof meta.fiscal_year === "number"
        ? meta.fiscal_year
        : parseInt(String(meta.fiscal_year), 10);
    if (n === fy) return true;
  }
  if (
    p.membership_fiscal_year == null &&
    meta?.fiscal_years == null &&
    meta?.fiscal_year == null
  ) {
    return fiscalYearForDate(new Date(p.created_at)) === fy;
  }
  return false;
}

function hasStripeForYear(payments: PaymentRowForFee[], fy: number): boolean {
  return payments.some(
    (p) => p.method === "stripe" && paymentCoversFiscalYear(p, fy)
  );
}

function hasAnyFeePaymentForYear(payments: PaymentRowForFee[], fy: number): boolean {
  return payments.some((p) => paymentCoversFiscalYear(p, fy));
}

/**
 * 会費の表示用ステータス（過去3年度分）
 */
export function buildMembershipFeeYearRows(
  payments: PaymentRowForFee[],
  latestExpiryDate: string | null | undefined,
  yearsCount = 3,
  refDate = new Date()
): MembershipFeeYearRow[] {
  const feePayments = payments.filter((p) => p.purpose === "membership_fee");
  const years = recentFiscalYears(yearsCount, refDate);
  const exp = latestExpiryDate?.trim() ?? "";

  return years.map((fy) => {
    let status: MembershipFeeDisplayStatus = "未払い";
    if (hasStripeForYear(feePayments, fy)) {
      status = "決済済み";
    } else if (hasAnyFeePaymentForYear(feePayments, fy)) {
      status = "支払い済み";
    } else if (exp && exp >= fiscalYearEndIso(fy)) {
      status = "支払い済み";
    }
    return {
      fiscal_year: fy,
      label: formatFiscalYearLabel(fy),
      status,
    };
  });
}

export function isPaidForMembershipFiscalYear(
  payments: PaymentRowForFee[],
  latestExpiryDate: string | null | undefined,
  fy: number
): boolean {
  const feePayments = payments.filter((p) => p.purpose === "membership_fee");
  if (hasStripeForYear(feePayments, fy)) return true;
  if (hasAnyFeePaymentForYear(feePayments, fy)) return true;
  const exp = latestExpiryDate?.trim() ?? "";
  if (exp && exp >= fiscalYearEndIso(fy)) return true;
  return false;
}

/** 指定年度の会費が未納か（pending は判定対象外で true を返す＝一覧に出さない想定） */
export function isUnpaidForMembershipFiscalYear(
  payments: PaymentRowForFee[],
  latestExpiryDate: string | null | undefined,
  fy: number
): boolean {
  return !isPaidForMembershipFiscalYear(payments, latestExpiryDate, fy);
}
