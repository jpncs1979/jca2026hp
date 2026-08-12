import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/is-current-user-admin";

/** 事務局によるお知らせ一覧取得（未公開の記事も含む） */
export async function GET() {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("news")
    .select("id, title, content, category, publish_date, is_important, created_at")
    .order("publish_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ news: data ?? [] });
}

/** 事務局によるお知らせ新規投稿 */
export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  const content = String(body.content ?? "").trim();
  const category = body.category ? String(body.category).trim() : null;
  const publishDate = String(body.publish_date ?? "").trim();
  const isImportant = Boolean(body.is_important);

  if (!title || !content || !publishDate) {
    return NextResponse.json(
      { error: "タイトル・本文・公開日は必須です" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("news")
    .insert({
      title,
      content,
      category,
      publish_date: publishDate,
      is_important: isImportant,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data?.id });
}
