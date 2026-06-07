/** 会員一覧 CSV（管理画面・API 共通） */

import { formatMemberNumber } from "@/lib/member-number";
import { joinAddressLine } from "@/lib/japanese-address";
import { type FeePaymentFilterKey } from "@/lib/excel-fee-payment";
import {
  isCssPaymentMember,
  type ProfilePaymentFields,
} from "@/lib/payment-channel";

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
  /** @deprecated payment_channel を使用 */
  is_css_user?: boolean | null;
  payment_channel?: string | null;
  payment_channel_note?: string | null;
  membership_valid_until?: string | null;
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

/** CSS（口座振替）経路か */
export function isCssFeeRouteForProfile(p: ProfileForMemberCsv): boolean {
  if (isCssPaymentMember(p as ProfilePaymentFields)) return true;
  const pm = getLatestMembershipCsv(p)?.payment_method;
  return pm === "css";
}

function hasStripeCustomer(p: ProfileForMemberCsv): boolean {
  return typeof p.stripe_customer_id === "string" && p.stripe_customer_id.trim() !== "";
}

/**
 * 会員一覧の絞り込み・検索用キー（CSS / クレジットカード登録済み / 空欄 の3種類）。
 * - CSS（口座振替）: CSS と記録された会員。
 * - クレジットカード: 実際にカードを登録済み（stripe_customer_id あり）の会員のみ。
 * - 空欄: それ以外（カード未登録。しくみネット・振込・新規取り込み等）。
 */
export function feePaymentCategoryKey(p: ProfileForMemberCsv): FeePaymentFilterKey {
  if (isCssPaymentMember(p as ProfilePaymentFields) || isCssFeeRouteForProfile(p)) {
    return "fee_css";
  }
  if (hasStripeCustomer(p)) return "card_registered";
  return "fee_blank";
}

/**
 * 一覧・CSV 用の統一「会費支払い方法」表示。
 * CSS / クレジットカード（登録済みのみ）/ 空欄。
 */
export function unifiedPaymentMethodLabel(p: ProfileForMemberCsv): string {
  const key = feePaymentCategoryKey(p);
  if (key === "fee_css") return "CSS";
  if (key === "card_registered") return "クレジットカード";
  return "";
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
