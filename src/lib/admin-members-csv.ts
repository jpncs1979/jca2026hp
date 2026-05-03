/** 会員一覧 CSV（管理画面・API 共通） */

import { formatMemberNumber } from "@/lib/member-number";
import { joinAddressLine } from "@/lib/japanese-address";
import {
  FEE_PAYMENT_FILTER_LABELS,
  type FeePaymentFilterKey,
} from "@/lib/excel-fee-payment";

export const MEMBERSHIP_LABELS_CSV: Record<string, string> = {
  regular: "正会員",
  student: "学生会員",
  supporting: "賛助会員",
  friend: "会友",
};

export type MembershipRowCsv = { join_date?: string; expiry_date?: string; payment_method?: string };

export type ProfileForMemberCsv = {
  id: string;
  member_number: number | null;
  name: string;
  name_kana: string;
  email: string;
  zip_code?: string | null;
  address?: string | null;
  address_prefecture?: string | null;
  address_city?: string | null;
  address_street?: string | null;
  address_building?: string | null;
  phone?: string | null;
  affiliation?: string | null;
  status: string;
  membership_type: string;
  is_ica_member?: boolean;
  officer_title?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  notes?: string | null;
  /** 銀行振込（CSS）経路。true なら会費は CSS */
  is_css_user?: boolean | null;
  /** Stripe Customer ID（カード登録の有無） */
  stripe_customer_id?: string | null;
  /** signup | import（Excel 等） */
  source?: string | null;
  /** Excel「会費支払い方法」列の区分（css / shikuminet / furikomi / blank / credit_card 等） */
  import_payment_kind?: string | null;
  memberships?: MembershipRowCsv[] | null;
};

export function getLatestMembershipCsv(
  p: ProfileForMemberCsv
): MembershipRowCsv | undefined {
  const arr = p.memberships ?? [];
  return [...arr].sort((a, b) => (b.expiry_date ?? "").localeCompare(a.expiry_date ?? ""))[0];
}

/** CSS（銀行振込）経路か（プロフィールの is_css_user または会員レコードの payment_method） */
export function isCssFeeRouteForProfile(p: ProfileForMemberCsv): boolean {
  if (p.is_css_user === true) return true;
  const pm = getLatestMembershipCsv(p)?.payment_method;
  return pm === "css";
}

function hasStripeCustomer(p: ProfileForMemberCsv): boolean {
  return typeof p.stripe_customer_id === "string" && p.stripe_customer_id.trim() !== "";
}

/** 会員一覧の絞り込み・検索用キー（会費4区分＋クレジット登録済/未） */
export function feePaymentCategoryKey(p: ProfileForMemberCsv): FeePaymentFilterKey {
  const k = (p.import_payment_kind ?? "").trim();
  const pm = getLatestMembershipCsv(p)?.payment_method;
  const hasCard = hasStripeCustomer(p);

  if (k === "css") return "fee_css";
  if (k === "shikuminet") return "fee_shikuminet";
  if (k === "furikomi" || k === "web_transfer" || k === "other") return "fee_furikomi";
  if (k === "blank") return "fee_blank";

  const stripeKind =
    k === "credit_card" ||
    k === "legacy_credit" ||
    k === "online_stripe_ok" ||
    k === "online_stripe_pending";

  if (stripeKind || pm === "stripe") {
    if (hasCard || k === "online_stripe_ok") return "card_registered";
    return "card_pending";
  }

  if (isCssFeeRouteForProfile(p)) return "fee_css";
  if (pm === "transfer") return "fee_furikomi";
  if (pm === "css") return "fee_css";
  return "fee_blank";
}

/**
 * 一覧・CSV 用の統一「会費支払い方法」表示。
 * CSS / シクミネット / 振込 / ー（空欄）/ クレジット（登録済・未）
 */
export function unifiedPaymentMethodLabel(p: ProfileForMemberCsv): string {
  return FEE_PAYMENT_FILTER_LABELS[feePaymentCategoryKey(p)];
}

export function profileToCsvRow(
  p: ProfileForMemberCsv,
  unpaidTargetLabel?: string | null
): Record<string, string> {
  const latest = getLatestMembershipCsv(p);
  const pref = (p.address_prefecture ?? "").trim();
  const city = (p.address_city ?? "").trim();
  const street = (p.address_street ?? "").trim();
  const building = (p.address_building ?? "").trim();
  const lineFromParts = joinAddressLine({
    prefecture: pref,
    city,
    street,
    building,
  });
  const 住所連結 = lineFromParts || (p.address ?? "").trim();
  return {
    ...(unpaidTargetLabel ? { 未納の対象: unpaidTargetLabel } : {}),
    会員ID: p.id ?? "",
    会員番号:
      p.member_number != null ? formatMemberNumber(p.member_number, "") : "",
    氏名: p.name ?? "",
    ふりがな: p.name_kana ?? "",
    メール: p.email ?? "",
    郵便番号: p.zip_code ?? "",
    都道府県: pref,
    市区町村: city,
    番地: street,
    建物名: building,
    住所: 住所連結,
    電話番号: p.phone ?? "",
    所属: p.affiliation ?? "",
    種別: MEMBERSHIP_LABELS_CSV[p.membership_type] ?? p.membership_type,
    ステータス: p.status ?? "",
    ICA会員: p.is_ica_member ? "○" : "－",
    役員: p.officer_title?.trim() ?? "",
    有効期限: latest?.expiry_date ?? "",
    会費支払い方法: unifiedPaymentMethodLabel(p),
    性別: p.gender ?? "",
    生年月日: p.birth_date ?? "",
    備考: p.notes ?? "",
  };
}

export function buildMembersCsvContent(rows: Record<string, string>[]): string {
  if (rows.length === 0) {
    return "";
  }
  const headers = Object.keys(rows[0]!);
  const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(",")),
  ].join("\n");
}
