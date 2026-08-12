import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/is-current-user-admin";

/** 事務局によるお知らせ更新 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const update: Record<string, unknown> = {};
  if (body.title !== undefined) update.title = String(body.title).trim();
  if (body.content !== undefined) update.content = String(body.content).trim();
  if (body.category !== undefined) {
    update.category = body.category ? String(body.category).trim() : null;
  }
  if (body.publish_date !== undefined) {
    update.publish_date = String(body.publish_date).trim();
  }
  if (body.is_important !== undefined) {
    update.is_important = Boolean(body.is_important);
  }

  if (update.title === "" || update.content === "" || update.publish_date === "") {
    return NextResponse.json(
      { error: "タイトル・本文・公開日は必須です" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.from("news").update(update).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/** 事務局によるお知らせ削除 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("news").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
