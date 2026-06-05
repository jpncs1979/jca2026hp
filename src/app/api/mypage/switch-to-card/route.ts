import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { paymentChannelPatchFromCssToggle } from "@/lib/payment-channel";

/**
 * クレジットカード支払いに切り替えた際に呼ぶ。
 * CSS 経路からカード経路へ切替（1月のカード自動請求の対象になり得る）。
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const cardPatch = paymentChannelPatchFromCssToggle(false);

    if (!profile) {
      const { data: byEmail } = await admin
        .from("profiles")
        .select("id")
        .is("user_id", null)
        .ilike("email", user.email ?? "")
        .maybeSingle();
      if (!byEmail) {
        return NextResponse.json({ error: "プロフィールが見つかりません" }, { status: 404 });
      }
      const { error } = await admin
        .from("profiles")
        .update({ ...cardPatch, updated_at: new Date().toISOString() })
        .eq("id", byEmail.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    const { error } = await admin
      .from("profiles")
      .update({ ...cardPatch, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("switch-to-card error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "切り替えに失敗しました" },
      { status: 500 }
    );
  }
}
