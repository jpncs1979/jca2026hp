/**
 * 全会員の会費支払状況（年度別・手段）を CSV 用に組み立てる。
 */

import { formatMemberNumber } from "@/lib/member-number";
import {
  getLatestMembershipCsv,
  MEMBERSHIP_LABELS_CSV,
  unifiedPaymentMethodLabel,
  type ProfileForMemberCsv,
} from "@/lib/admin-members-csv";
import {
  buildMembershipFeeYearRows,
  paymentCoversFiscalYear,
  type MembershipFeeDisplayStatus,
  type PaymentRowForFee,
} from "@/lib/membership-fee-status";

/** 出力する会費の事業年度の個数（新しい年度から遡る） */
export const FEE_STATUS_FISCAL_YEARS_COUNT = 5;

function methodLabelForRecordedPayment(m: string | null | undefined): string {
  const x = (m ?? "").trim();
  if (x === "stripe") return "Stripe";
  if (x === "transfer") return "振込";
  if (x === "css") return "CSS";
  return x || "記録";
}

/**
 * 年度セル: 支払状況＋その年度に紐づく入金手段（あれば）。
 * 入金レコードがなく有効期限のみで「支払い済み」になる場合は注記する。
 */
export function formatFeeYearCellDetailed(
  status: MembershipFeeDisplayStatus,
  feePayments: PaymentRowForFee[],
  fy: number
): string {
  const covering = feePayments.filter(
    (p) => p.purpose === "membership_fee" && paymentCoversFiscalYear(p, fy)
  );
  if (status === "未払い") return "未払い";
  if (covering.length === 0) {
    if (status === "支払い済み") return "支払い済み（有効期限による扱い）";
    return status;
  }
  const stripe = covering.some((p) => p.method === "stripe");
  if (stripe) {
    return status === "決済済み" ? "決済済み（Stripe）" : "支払い済み（Stripe）";
  }
  const others = [...new Set(covering.map((p) => methodLabelForRecordedPayment(p.method)))];
  return `${status}（${others.join("・")}）`;
}

export function buildFeeStatusCsvRow(
  p: ProfileForMemberCsv,
  payments: PaymentRowForFee[],
  refDate: Date
): Record<string, string> {
  const latest = getLatestMembershipCsv(p);
  const feePayments = payments.filter((x) => x.purpose === "membership_fee");
  const yearRows = buildMembershipFeeYearRows(
    payments,
    latest?.expiry_date,
    FEE_STATUS_FISCAL_YEARS_COUNT,
    refDate
  );

  const hasStripeCustomer =
    typeof p.stripe_customer_id === "string" && p.stripe_customer_id.trim() !== "";

  const row: Record<string, string> = {
    会員ID: p.id ?? "",
    会員番号:
      p.member_number != null ? formatMemberNumber(p.member_number, "") : "",
    氏名: p.name ?? "",
    メール: p.email ?? "",
    種別: MEMBERSHIP_LABELS_CSV[p.membership_type] ?? p.membership_type,
    ステータス: p.status ?? "",
    会費支払い方法: unifiedPaymentMethodLabel(p),
    会員契約の支払手段コード: latest?.payment_method ?? "",
    import_payment_kind: p.import_payment_kind ?? "",
    Stripe顧客登録: hasStripeCustomer ? "あり" : "なし",
    会員資格の末日: latest?.expiry_date ?? "",
  };

  for (const yr of yearRows) {
    row[`${yr.label}会費`] = formatFeeYearCellDetailed(
      yr.status,
      feePayments,
      yr.fiscal_year
    );
  }

  return row;
}
