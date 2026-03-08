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
      return NextResponse.json(
        { error: "profile_ids を指定してください。" },
        { status: 400 }
      );
    }

    for (const profileId of profile_ids) {
      const { data: latest } = await admin
        .from("memberships")
        .select("id, expiry_date")
        .eq("profile_id", profileId)
        .order("expiry_date", { ascending: false })
        .limit(1)
        .single();

      if (latest?.id) {
        const current = new Date(latest.expiry_date);
        const nextYear = new Date(current);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        await admin
          .from("memberships")
          .update({ expiry_date: nextYear.toISOString().slice(0, 10), updated_at: new Date().toISOString() })
          .eq("id", latest.id);
      } else {
        const joinDate = new Date();
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        await admin.from("memberships").insert({
          profile_id: profileId,
          join_date: joinDate.toISOString().slice(0, 10),
          expiry_date: expiryDate.toISOString().slice(0, 10),
          payment_method: "css",
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Bulk extend API error:", err);
    return NextResponse.json(
      { error: "一括延長の処理に失敗しました。" },
      { status: 500 }
    );
  }
}
