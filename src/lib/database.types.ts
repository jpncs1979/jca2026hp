/**
 * 会員システム用 DB 型定義
 */

export type ProfileCategory = "general" | "student" | "professional";
export type MembershipType = "regular" | "student" | "supporting";
export type ProfileStatus = "pending" | "active" | "expired";
export type PaymentMethod = "stripe" | "css" | "transfer";
export type PaymentPurpose = "membership_fee" | "competition_fee";
export type PaymentChannel = "card" | "other";

export interface Profile {
  id: string;
  user_id: string | null;
  member_number: number | null;
  name: string;
  name_kana: string;
  email: string;
  zip_code: string | null;
  address: string | null;
  address_prefecture?: string | null;
  address_city?: string | null;
  address_street?: string | null;
  address_building?: string | null;
  phone: string | null;
  affiliation: string | null;
  category: ProfileCategory;
  membership_type: MembershipType;
  status: ProfileStatus;
  is_admin: boolean;
  /** @deprecated payment_channel を使用。互換用 */
  is_css_user?: boolean | null;
  /** 会費継続の支払い経路: card | other */
  payment_channel?: PaymentChannel | null;
  /** other 時のメモ（CSS は "CSS"） */
  payment_channel_note?: string | null;
  /** 会員資格の末日（一覧・照合の主参照） */
  membership_valid_until?: string | null;
  /** 手動退会時の事務局メモ */
  expulsion_note?: string | null;
  /** @deprecated 強制退会仕様は廃止。旧データ用に列のみ残存 */
  expelled_at?: string | null;
  /** @deprecated 強制退会仕様は廃止。旧データ用に列のみ残存 */
  expulsion_reason?: string | null;
  /** Stripe Customer ID（年会費の自動引き落とし・Checkout 再利用） */
  stripe_customer_id?: string | null;
  /** コンクール申込（同時入会）経由で登録された場合の大会スラッグ（例: young-2026） */
  simultaneous_join_competition_slug?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  profile_id: string;
  join_date: string;
  /** 会員資格の末日（会員年度は 4/1〜翌3/31。多くは YYYY-03-31） */
  expiry_date: string;
  payment_method: PaymentMethod;
  created_at: string;
  updated_at: string;
}

export interface ApplicationRow {
  id: string;
  profile_id: string | null;
  competition_id: string;
  user_id: string | null;
  name: string;
  furigana: string;
  email: string | null;
  birth_date: string | null;
  age_at_reference: number | null;
  member_type: string;
  member_number: string | null;
  category: string;
  selected_piece_preliminary: string | null;
  selected_piece_final: string | null;
  video_url: string | null;
  accompanist_info: string | null;
  payment_status: string;
  /** stripe_card | bank_transfer（マイグレーション 018） */
  payment_route?: string | null;
  /** 銀行振込時の領収書画像（Storage パス） */
  transfer_receipt_path?: string | null;
  amount: number | null;
  payment_date: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  profile_id: string;
  amount: number;
  purpose: PaymentPurpose;
  method: PaymentMethod;
  transaction_id: string | null;
  /** 会費の対象年度（事業年度 2/1〜翌1/31 の開始年）。マイグレーション 010 参照 */
  membership_fiscal_year?: number | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}
