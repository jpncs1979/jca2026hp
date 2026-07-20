import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const BUCKET = "competition_portraits";

type RouteContext = { params: Promise<{ id: string }> };

/** 申込者の顔写真を一時署名 URL へリダイレクト（管理者のみ） */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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

    const { data: app, error: appErr } = await admin
      .from("applications")
      .select("portrait_path")
      .eq("id", id)
      .maybeSingle();

    if (appErr || !app) {
      return NextResponse.json({ error: "申込が見つかりません。" }, { status: 404 });
    }

    const path = (app as { portrait_path?: string | null }).portrait_path;
    if (!path?.trim()) {
      return NextResponse.json({ error: "顔写真はまだ登録されていません。" }, { status: 404 });
    }

    const { data: signed, error: signErr } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(path, 300);

    if (signErr || !signed?.signedUrl) {
      console.error("[admin portrait]", signErr);
      return NextResponse.json({ error: "顔写真 URL の取得に失敗しました。" }, { status: 500 });
    }

    return NextResponse.redirect(signed.signedUrl);
  } catch (err) {
    console.error("[admin applications portrait]", err);
    return NextResponse.json({ error: "エラーが発生しました。" }, { status: 500 });
  }
}
