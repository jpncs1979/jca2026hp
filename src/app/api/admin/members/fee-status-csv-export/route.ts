import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  buildMembersCsvContent,
  type ProfileForMemberCsv,
} from "@/lib/admin-members-csv";
import { buildFeeStatusCsvRow } from "@/lib/admin-members-fee-status-csv";
import type { PaymentRowForFee } from "@/lib/membership-fee-status";

const SELECT_ALL = `
  id,
  member_number,
  name,
  name_kana,
  email,
  zip_code,
  address,
  address_prefecture,
  address_city,
  address_street,
  address_building,
  phone,
  affiliation,
  status,
  category,
  membership_type,
  is_ica_member,
  officer_title,
  gender,
  birth_date,
  notes,
  created_at,
  is_css_user,
  stripe_customer_id,
  source,
  import_payment_kind,
  memberships(join_date, expiry_date, payment_method)
`;

const SELECT_BASE = `
  id,
  member_number,
  name,
  name_kana,
  email,
  zip_code,
  address,
  address_prefecture,
  address_city,
  address_street,
  address_building,
  phone,
  affiliation,
  status,
  category,
  membership_type,
  created_at,
  is_css_user,
  stripe_customer_id,
  source,
  import_payment_kind,
  memberships(join_date, expiry_date, payment_method)
`;

/**
 * 会員名簿ベースの全会員について、直近数年度の会費状況と支払い方法関連列を CSV で返す。
 * 認証: 管理ユーザー（is_admin）のみ。
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "未認証" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: adminProfile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!adminProfile?.is_admin) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    let result = await admin
      .from("profiles")
      .select(SELECT_ALL)
      .or("is_admin.eq.false,is_admin.is.null,officer_title.not.is.null")
      .order("created_at", { ascending: false });

    let profiles = result.data as ProfileForMemberCsv[] | null;
    let error = result.error;

    if (error && (error.message?.includes("column") || (error as { code?: string }).code === "42703")) {
      const res = await admin
        .from("profiles")
        .select(SELECT_BASE)
        .or("is_admin.eq.false,is_admin.is.null")
        .order("created_at", { ascending: false });
      if (res.error) {
        console.error("fee-status-csv-export fetch profiles:", res.error);
        return NextResponse.json({ error: res.error.message }, { status: 500 });
      }
      profiles = (res.data ?? []).map((p: Record<string, unknown>) => ({
        ...p,
        is_ica_member: false,
        officer_title: null,
        gender: null,
        birth_date: null,
        notes: null,
        is_css_user: p.is_css_user ?? false,
        stripe_customer_id: p.stripe_customer_id ?? null,
        source: (p as { source?: string | null }).source ?? "signup",
        import_payment_kind:
          (p as { import_payment_kind?: string | null }).import_payment_kind ?? null,
      })) as ProfileForMemberCsv[];
    } else if (error) {
      console.error("fee-status-csv-export fetch profiles:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const list = (profiles ?? []) as ProfileForMemberCsv[];
    const refDate = new Date();

    const paymentsByProfile = new Map<string, PaymentRowForFee[]>();
    const chunkSize = 150;
    const ids = list.map((p) => p.id);

    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      if (chunk.length === 0) break;
      const { data: payChunk, error: payErr } = await admin
        .from("payments")
        .select(
          "profile_id, purpose, method, metadata, membership_fiscal_year, created_at"
        )
        .in("profile_id", chunk)
        .eq("purpose", "membership_fee");

      if (payErr) {
        console.error("fee-status-csv-export payments:", payErr);
        return NextResponse.json({ error: payErr.message }, { status: 500 });
      }

      for (const row of payChunk ?? []) {
        const pid = (row as { profile_id: string }).profile_id;
        if (!paymentsByProfile.has(pid)) paymentsByProfile.set(pid, []);
        paymentsByProfile.get(pid)!.push(row as PaymentRowForFee);
      }
    }

    const csvRows = list.map((p) =>
      buildFeeStatusCsvRow(p, paymentsByProfile.get(p.id) ?? [], refDate)
    );

    if (csvRows.length === 0) {
      return NextResponse.json(
        { error: "会員データがありません。" },
        { status: 404 }
      );
    }

    const csv = buildMembersCsvContent(csvRows);
    const bom = "\uFEFF";
    const filename = `会費支払状況_全会員${list.length}件_${refDate.toISOString().slice(0, 10)}.csv`;

    return new NextResponse(bom + csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (err) {
    console.error("fee-status-csv-export:", err);
    return NextResponse.json(
      { error: "CSV の生成に失敗しました。" },
      { status: 500 }
    );
  }
}
