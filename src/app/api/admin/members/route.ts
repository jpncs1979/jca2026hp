import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const icaOnly = searchParams.get("ica") === "1";
    const type = searchParams.get("type"); // regular, student, supporting, friend
    const unpaid = searchParams.get("unpaid") === "1";
    const status = searchParams.get("status"); // pending, active, expired

    const admin = createAdminClient();
    const selectAll = `
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
        category,
        membership_type,
        is_ica_member,
        officer_title,
        gender,
        birth_date,
        notes,
        created_at,
        memberships(join_date, expiry_date, payment_method)
      `;
    const selectBase = `
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
        category,
        membership_type,
        created_at,
        memberships(join_date, expiry_date, payment_method)
      `;

    // 会員名簿＝会員＋役員（004/006 未適用時は is_admin のみで判定）
    let q = admin
      .from("profiles")
      .select(selectAll)
      .or("is_admin.eq.false,is_admin.is.null,officer_title.not.is.null")
      .order("created_at", { ascending: false });

    if (icaOnly) {
      q = q.eq("is_ica_member", true);
    }
    if (type) {
      q = q.eq("membership_type", type);
    }
    if (status) {
      q = q.eq("status", status);
    }

    let result = await q;
    let profiles = result.data;
    let error = result.error;

    if (error && (error.message?.includes("column") || (error as { code?: string }).code === "42703")) {
      const fallbackQ = admin
        .from("profiles")
        .select(selectBase)
        .or("is_admin.eq.false,is_admin.is.null")
        .order("created_at", { ascending: false });
      let fallback = fallbackQ;
      if (type) fallback = fallback.eq("membership_type", type);
      if (status) fallback = fallback.eq("status", status);
      const res = await fallback;
      if (res.error) {
        console.error("Admin members API DB error (fallback):", res.error.message);
        return NextResponse.json({ error: res.error.message }, { status: 500 });
      }
      profiles = (res.data ?? []).map((p: Record<string, unknown>) => ({
        ...p,
        is_ica_member: false,
        officer_title: null,
        gender: null,
        birth_date: null,
        notes: null,
      }));
      if (icaOnly) {
        profiles = []; // 004 未適用では ICA フィルタ不可
      }
    } else if (error) {
      console.error("Admin members API DB error:", error.message, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let list = profiles ?? [];
    if (unpaid) {
      const today = new Date().toISOString().slice(0, 10);
      list = list.filter((p: { memberships?: { expiry_date?: string }[] | null }) => {
        const arr = p.memberships ?? [];
        const latest = [...arr].sort((a, b) => (b.expiry_date ?? "").localeCompare(a.expiry_date ?? ""))[0];
        const exp = latest?.expiry_date;
        return !exp || exp < today;
      });
    }

    return NextResponse.json({ profiles: list });
  } catch (err) {
    console.error("Admin members API error:", err);
    return NextResponse.json(
      { error: "会員一覧の取得に失敗しました。" },
      { status: 500 }
    );
  }
}
