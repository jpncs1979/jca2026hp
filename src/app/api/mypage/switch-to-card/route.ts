import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * クレジットカード支払いに切り替えた際に呼ぶ。
 * 自分のプロフィールの is_css_user を false にし、銀行振込（CSS）経路から外す（1月のカード自動請求の対象になり得る）。
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
        .update({ is_css_user: false, updated_at: new Date().toISOString() })
        .eq("id", byEmail.id);
      if (error) {
        if (error.message?.includes("is_css_user") || error.message?.includes("column")) {
          return NextResponse.json(
            { error: "is_css_user カラムがありません。マイグレーション 008 を実行してください。" },
            { status: 500 }
          );
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    const { error } = await admin
      .from("profiles")
      .update({ is_css_user: false, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    if (error) {
      if (error.message?.includes("is_css_user") || error.message?.includes("column")) {
        return NextResponse.json(
          { error: "is_css_user カラムがありません。マイグレーション 008 を実行してください。" },
          { status: 500 }
        );
      }
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
