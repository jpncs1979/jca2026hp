import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

/** 強制退会者のログイン用メールを退避し、同一メールでのウェブ新規入会を可能にする（事務局判断後） */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: profileId } = await params;
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

    const { data: profile, error: fetchError } = await admin
      .from("profiles")
      .select("id, status, email, user_id")
      .eq("id", profileId)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json({ error: "会員が見つかりません" }, { status: 404 });
    }

    if (profile.status !== "expelled") {
      return NextResponse.json(
        { error: "強制退会（expelled）の会員のみ実行できます。" },
        { status: 400 }
      );
    }

    const currentEmail = String(profile.email ?? "").trim();
    if (!currentEmail) {
      return NextResponse.json({ error: "メールアドレスが空です。" }, { status: 400 });
    }

    const archiveLocal = `expelled-archived-${String(profileId).replace(/-/g, "")}@members.invalid`;
    if (currentEmail.toLowerCase() === archiveLocal.toLowerCase()) {
      return NextResponse.json({
        ok: true,
        message: "既に退避済みです。",
        email: archiveLocal,
      });
    }

    const userId = profile.user_id as string | null;

    const nowIso = new Date().toISOString();
    const fullUpdate: Record<string, unknown> = {
      email: archiveLocal,
      user_id: null,
      status: "expired",
      email_before_rejoin_release: currentEmail,
      updated_at: nowIso,
    };

    let updateError = (await admin.from("profiles").update(fullUpdate).eq("id", profileId).eq("status", "expelled"))
      .error;

    if (
      updateError &&
      (updateError.message?.includes("email_before_rejoin_release") ||
        updateError.message?.includes("column"))
    ) {
      updateError = (
        await admin
          .from("profiles")
          .update({
            email: archiveLocal,
            user_id: null,
            status: "expired",
            updated_at: nowIso,
          })
          .eq("id", profileId)
          .eq("status", "expelled")
      ).error;
    }

    if (updateError) {
      console.error("[release-rejoin-email] update:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (userId) {
      const { error: authDel } = await admin.auth.admin.deleteUser(userId);
      if (authDel) {
        console.warn("[release-rejoin-email] auth delete:", authDel);
      }
    }

    return NextResponse.json({
      ok: true,
      message:
        "メールアドレスを退避し、ステータスを期限切れにしました。本人は同じメールでウェブ入会をやり直せます。",
      archived_placeholder_email: archiveLocal,
      former_login_email: currentEmail,
    });
  } catch (err) {
    console.error("[release-rejoin-email]", err);
    return NextResponse.json({ error: "処理に失敗しました" }, { status: 500 });
  }
}
