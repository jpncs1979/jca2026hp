import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "未認証" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { profile_ids } = await request.json();
    if (!Array.isArray(profile_ids) || profile_ids.length === 0) {
      return NextResponse.json({ error: "profile_ids が必要です" }, { status: 400 });
    }

    // 各 profile の最新 membership の expiry_date を1年延長
    const { data: memberships } = await admin
      .from("memberships")
      .select("id, profile_id, expiry_date")
      .in("profile_id", profile_ids)
      .order("expiry_date", { ascending: false });

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ error: "対象の会員に有効な契約がありません" }, { status: 400 });
    }

    const profileToMembership = new Map<string, { id: string; expiry_date: string }>();
    for (const m of memberships) {
      if (!profileToMembership.has(m.profile_id)) {
        profileToMembership.set(m.profile_id, { id: m.id, expiry_date: m.expiry_date });
      }
    }

    let updated = 0;
    for (const pid of profile_ids) {
      const mem = profileToMembership.get(pid);
      if (!mem) continue;

      const current = new Date(mem.expiry_date);
      const nextYear = new Date(current);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const newExpiry = nextYear.toISOString().split("T")[0];

      const { error } = await admin
        .from("memberships")
        .update({ expiry_date: newExpiry, updated_at: new Date().toISOString() })
        .eq("id", mem.id);

      if (!error) updated++;
    }

    return NextResponse.json({ success: true, updated });
  } catch (err) {
    console.error("Bulk extend error:", err);
    return NextResponse.json(
      { error: "処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
