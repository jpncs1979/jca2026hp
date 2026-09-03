import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/is-current-user-admin";

const BUCKET = "member-contents";
const CATEGORIES = ["bulletin", "video", "score", "other"] as const;
type Category = (typeof CATEGORIES)[number];

/** 事務局: 会員コンテンツ更新（メタデータ、任意でファイル差し替え） */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }
  const { id } = await params;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "リクエスト形式が不正です" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing, error: exErr } = await admin
    .from("member_contents")
    .select("id, file_path, category")
    .eq("id", id)
    .maybeSingle();
  if (exErr || !existing) {
    return NextResponse.json({ error: "コンテンツが見つかりません" }, { status: 404 });
  }

  const title = String(form.get("title") ?? "").trim();
  const categoryRaw = String(form.get("category") ?? existing.category ?? "bulletin").trim();
  const category: Category = (CATEGORIES as readonly string[]).includes(categoryRaw)
    ? (categoryRaw as Category)
    : "bulletin";
  const description = String(form.get("description") ?? "").trim() || null;
  const issueLabel = String(form.get("issue_label") ?? "").trim() || null;
  const issueDate = String(form.get("issue_date") ?? "").trim() || null;
  const sortOrder = Number.parseInt(String(form.get("sort_order") ?? "0"), 10) || 0;
  const isPublished = String(form.get("is_published") ?? "true") === "true";
  const externalUrl = String(form.get("external_url") ?? "").trim() || null;

  if (!title) {
    return NextResponse.json({ error: "タイトルは必須です" }, { status: 400 });
  }

  const fileEntry = form.get("file");
  const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;

  let filePath = existing.file_path as string | null;
  const oldPath = existing.file_path as string | null;

  if (file) {
    const newPath = `${category === "bulletin" ? "bulletins" : category}/${randomUUID()}.pdf`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await admin.storage.from(BUCKET).upload(newPath, buffer, {
      contentType: file.type || "application/pdf",
      upsert: false,
    });
    if (upErr) {
      return NextResponse.json(
        { error: `ファイルのアップロードに失敗しました: ${upErr.message}` },
        { status: 500 }
      );
    }
    filePath = newPath;
  }

  if (!filePath && !externalUrl) {
    return NextResponse.json(
      { error: "PDF ファイルまたは外部URLのいずれかが必要です" },
      { status: 400 }
    );
  }

  const { error } = await admin
    .from("member_contents")
    .update({
      title,
      description,
      category,
      issue_label: issueLabel,
      issue_date: issueDate,
      sort_order: sortOrder,
      file_path: filePath,
      external_url: externalUrl,
      is_published: isPublished,
    })
    .eq("id", id);

  if (error) {
    if (file && filePath) await admin.storage.from(BUCKET).remove([filePath]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (file && oldPath && oldPath !== filePath) {
    await admin.storage.from(BUCKET).remove([oldPath]);
  }

  return NextResponse.json({ success: true });
}

/** 事務局: 会員コンテンツ削除 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }
  const { id } = await params;
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("member_contents")
    .select("file_path")
    .eq("id", id)
    .maybeSingle();

  const { error } = await admin.from("member_contents").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (existing?.file_path) {
    await admin.storage.from(BUCKET).remove([existing.file_path]);
  }

  return NextResponse.json({ success: true });
}
