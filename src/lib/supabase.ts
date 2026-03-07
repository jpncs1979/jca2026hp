import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase =
  supabaseUrl.startsWith("http") && supabaseAnonKey.length > 0
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// 型定義（テーブル構造に合わせて拡張可能）
export type ApplicationMemberType = "会員" | "非会員" | "同時入会";
export type PaymentStatus = "pending" | "paid" | "cancelled" | "refunded";

export interface Competition {
  id: string;
  slug: string;
  name: string;
  year: number;
  reference_date: string;
  category_options: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  competition_id: string;
  user_id: string | null;
  name: string;
  furigana: string;
  email: string | null;
  birth_date: string;
  age_at_reference: number;
  member_type: ApplicationMemberType;
  member_number: string | null;
  category: string;
  selected_piece_preliminary: string | null;
  selected_piece_final: string | null;
  video_url: string | null;
  accompanist_info: string | null;
  payment_date: string | null;
  payment_status: PaymentStatus;
  created_at: string;
}

export interface News {
  id: string;
  title: string;
  content: string;
  category: string | null;
  publish_date: string;
  is_important: boolean;
  created_at: string;
}
