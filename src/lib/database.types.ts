/**
 * 会員システム用 DB 型定義
 */

export type ProfileCategory = "general" | "student" | "professional";
export type MembershipType = "regular" | "student" | "supporting";
export type ProfileStatus = "pending" | "active" | "expired";
export type PaymentMethod = "stripe" | "css" | "transfer";
export type PaymentPurpose = "membership_fee" | "competition_fee";

export interface Profile {
  id: string;
  user_id: string | null;
  member_number: number | null;
  name: string;
  name_kana: string;
  email: string;
  zip_code: string | null;
  address: string | null;
  phone: string | null;
  affiliation: string | null;
  category: ProfileCategory;
  membership_type: MembershipType;
  status: ProfileStatus;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  profile_id: string;
  join_date: string;
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
  created_at: string;
}
