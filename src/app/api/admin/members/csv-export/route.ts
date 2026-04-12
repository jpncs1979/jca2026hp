import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  buildMembersCsvContent,
  profileToCsvRow,
  type ProfileForMemberCsv,
} from "@/lib/admin-members-csv";

const SELECT_FULL = `
  id,
  member_number,
  name,
  name_kana,
  email,
  zip_code,
  address,
  phone,
  affiliation,
  status,
  membership_type,
  is_ica_member,
  officer_title,
  gender,
  birth_date,
  notes,
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
  phone,
  affiliation,
  status,
  membership_type,
  created_at,
  is_css_user,
  stripe_customer_id,
  source,
  import_payment_kind,
  memberships(join_date, expiry_date, payment_method)
`;

/**
 * 管理画面で絞り込んだ会員の id 順に、会員一覧 CSV を返す。
 * body: { profile_ids: string[], unpaid_target_label?: string | null }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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

    let body: { profile_ids?: unknown; unpaid_target_label?: string | null };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON が不正です" }, { status: 400 });
    }

    const rawIds = body.profile_ids;
    if (!Array.isArray(rawIds) || rawIds.length === 0) {
      return NextResponse.json(
        { error: "profile_ids（1件以上）が必要です。" },
        { status: 400 }
      );
    }

    const profileIds = rawIds
      .map((id) => (typeof id === "string" ? id.trim() : ""))
      .filter(Boolean);
    if (profileIds.length === 0) {
      return NextResponse.json({ error: "有効な profile_ids がありません。" }, { status: 400 });
    }

    const unpaidLabel =
      typeof body.unpaid_target_label === "string" && body.unpaid_target_label.trim()
        ? body.unpaid_target_label.trim()
        : null;

    const byId = new Map<string, ProfileForMemberCsv>();
    const chunkSize = 120;

    for (let i = 0; i < profileIds.length; i += chunkSize) {
      const chunk = profileIds.slice(i, i + chunkSize);
      let { data: rows, error } = await admin.from("profiles").select(SELECT_FULL).in("id", chunk);

      if (error && (error.message?.includes("column") || (error as { code?: string }).code === "42703")) {
        const retry = await admin.from("profiles").select(SELECT_BASE).in("id", chunk);
        rows = (retry.data ?? []).map((p: Record<string, unknown>) => ({
          ...p,
          is_ica_member: false,
          officer_title: null,
          gender: null,
          birth_date: null,
          notes: null,
          is_css_user: p.is_css_user ?? false,
          stripe_customer_id: p.stripe_customer_id ?? null,
          source: (p.source as string | null | undefined) ?? "signup",
          import_payment_kind: (p as { import_payment_kind?: string | null }).import_payment_kind ?? null,
        })) as ProfileForMemberCsv[];
        error = retry.error;
      }

      if (error) {
        console.error("csv-export fetch:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      for (const row of rows ?? []) {
        byId.set((row as ProfileForMemberCsv).id, row as ProfileForMemberCsv);
      }
    }

    const ordered: ProfileForMemberCsv[] = [];
    for (const id of profileIds) {
      const p = byId.get(id);
      if (p) ordered.push(p);
    }

    const csvRows = ordered.map((p) => profileToCsvRow(p, unpaidLabel));
    if (csvRows.length === 0) {
      return NextResponse.json(
        { error: "会員データを取得できませんでした。" },
        { status: 404 }
      );
    }
    const csv = buildMembersCsvContent(csvRows);
    const bom = "\uFEFF";
    const filename = `会員一覧_絞り込み${ordered.length}件_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(bom + csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (err) {
    console.error("csv-export:", err);
    return NextResponse.json({ error: "CSV の生成に失敗しました。" }, { status: 500 });
  }
}
