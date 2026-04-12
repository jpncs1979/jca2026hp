import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  buildMembershipFeeYearRows,
  type PaymentRowForFee,
} from "@/lib/membership-fee-status";

/**
 * 会員マイページ用のデータ取得API
 * Admin クライアントで RLS を回避し、user_id 未設定のインポート会員（メール一致）も取得可能にする
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const admin = createAdminClient();
    const selectCols =
      "id, member_number, name, name_kana, email, status, affiliation, is_admin, zip_code, address, phone, is_css_user, membership_type, stripe_customer_id, source";

    // 1. user_id で検索
    let { data: profile } = await admin
      .from("profiles")
      .select(selectCols)
      .eq("user_id", u.id)
      .maybeSingle();

    // 2. 見つからなければメールで検索（インポート会員対応）
    if (!profile && u.email) {
      const { data: profByEmail } = await admin
        .from("profiles")
        .select(selectCols)
        .is("user_id", null)
        .ilike("email", u.email.trim())
        .maybeSingle();
      profile = profByEmail;
    }

    if (!profile) {
      return NextResponse.json({
        profile: null,
        membership: null,
        membership_fee_years: [],
        applications: [],
        contents: [],
      });
    }

    // memberships 取得
    const { data: memList } = await admin
      .from("memberships")
      .select("expiry_date, payment_method")
      .eq("profile_id", profile.id)
      .order("expiry_date", { ascending: false })
      .limit(1);
    const membership = memList?.[0] ?? null;

    const { data: feePayRows } = await admin
      .from("payments")
      .select("purpose, method, metadata, created_at")
      .eq("profile_id", profile.id)
      .eq("purpose", "membership_fee");
    const feePayments = (feePayRows ?? []) as PaymentRowForFee[];
    const membership_fee_years = buildMembershipFeeYearRows(
      feePayments,
      membership?.expiry_date,
      3
    );

    // member_contents 取得（有効会員のみ）
    let contents: Array<{ id: string; title: string; file_path: string }> = [];
    if (profile.status === "active") {
      const { data: cont } = await admin
        .from("member_contents")
        .select("id, title, file_path");
      contents = cont ?? [];
    }

    // applications 取得
    const { data: apps } = await admin
      .from("applications")
      .select("id, category, payment_status, created_at, competitions(name)")
      .or(`profile_id.eq.${profile.id},user_id.eq.${u.id}`);
    type AppRow = {
      id: string;
      category: string;
      payment_status: string;
      created_at: string;
      competitions?: { name: string } | { name: string }[];
    };
    const applications = (apps ?? []).map((a: AppRow) => {
      const row = a;
      const comp = row.competitions;
      const competition = comp
        ? Array.isArray(comp)
          ? comp[0]
            ? { name: (comp[0] as { name: string }).name }
            : undefined
          : { name: (comp as { name: string }).name }
        : undefined;
      return {
        id: row.id,
        category: row.category,
        payment_status: row.payment_status,
        created_at: row.created_at,
        competition,
      };
    });

    return NextResponse.json({
      profile,
      membership,
      membership_fee_years,
      applications,
      contents,
    });
  } catch (err) {
    console.error("Mypage data API error:", err);
    return NextResponse.json(
      { error: "データの取得に失敗しました" },
      { status: 500 }
    );
  }
}
