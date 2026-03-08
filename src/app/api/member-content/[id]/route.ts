import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { data: content, error: contentError } = await supabase
    .from("member_contents")
    .select("file_path, title")
    .eq("id", id)
    .single();

  if (contentError || !content) {
    return NextResponse.json({ error: "コンテンツが見つかりません" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, status")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.status !== "active") {
    return NextResponse.json({ error: "有効な会員のみご利用いただけます" }, { status: 403 });
  }

  const { data: signed } = await supabase.storage
    .from("member-contents")
    .createSignedUrl(content.file_path, 3600);

  if (!signed?.signedUrl) {
    return NextResponse.json({ error: "ファイルの取得に失敗しました" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
