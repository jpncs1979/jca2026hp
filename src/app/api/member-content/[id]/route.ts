import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireValidMember } from "@/lib/member-access";

const MEMBER_CONTENTS_BUCKET = "member-contents";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requireValidMember();
  if (!auth.ok) {
    if (auth.reason === "unauthenticated") {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "有効な会員のみご利用いただけます" },
      { status: 403 }
    );
  }

  const admin = createAdminClient();
  const { data: content, error: contentError } = await admin
    .from("member_contents")
    .select("file_path, external_url, title, is_published")
    .eq("id", id)
    .maybeSingle();

  if (contentError || !content || content.is_published === false) {
    return NextResponse.json({ error: "コンテンツが見つかりません" }, { status: 404 });
  }

  if (content.external_url) {
    return NextResponse.redirect(content.external_url);
  }

  if (!content.file_path) {
    return NextResponse.json({ error: "ファイルが登録されていません" }, { status: 404 });
  }

  const { data: signed } = await admin.storage
    .from(MEMBER_CONTENTS_BUCKET)
    .createSignedUrl(content.file_path, 3600);

  if (!signed?.signedUrl) {
    return NextResponse.json({ error: "ファイルの取得に失敗しました" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
