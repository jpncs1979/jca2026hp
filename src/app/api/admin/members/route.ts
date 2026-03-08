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
    const selectWithIca = `
        id,
        member_number,
        name,
        name_kana,
        email,
        status,
        category,
        membership_type,
        is_ica_member,
        memberships(expiry_date)
      `;
    const selectWithoutIca = `
        id,
        member_number,
        name,
        name_kana,
        email,
        status,
        category,
        membership_type,
        memberships(expiry_date)
      `;

    let q = admin
      .from("profiles")
      .select(icaOnly ? selectWithIca : selectWithoutIca)
      .or("is_admin.eq.false,is_admin.is.null")
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

    const { data: profiles, error } = await q;

    if (error) {
      console.error("Admin members API DB error:", error.message, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let list = profiles ?? [];
    if (unpaid) {
      const today = new Date().toISOString().slice(0, 10);
      list = list.filter((p) => {
        const exp = (p.memberships as { expiry_date?: string }[] | null)?.[0]?.expiry_date;
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
