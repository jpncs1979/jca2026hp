import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/is-current-user-admin";

const BUCKET = "member-contents";
const CATEGORIES = ["bulletin", "video", "score", "other"] as const;
type Category = (typeof CATEGORIES)[number];

const SELECT_COLS =
  "id, title, description, category, issue_label, issue_date, sort_order, file_path, external_url, is_published, published_at, created_at";

/** 事務局: 会員コンテンツ一覧（未公開含む） */
export async function GET() {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("member_contents")
    .select(SELECT_COLS)
    .order("issue_date", { ascending: false, nullsFirst: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}

/** 事務局: 会員コンテンツ新規登録（PDF アップロード） */
export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "リクエスト形式が不正です" }, { status: 400 });
  }

  const title = String(form.get("title") ?? "").trim();
  const categoryRaw = String(form.get("category") ?? "bulletin").trim();
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

  if (!file && !externalUrl) {
    return NextResponse.json(
      { error: "PDF ファイルまたは外部URLのいずれかが必要です" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  let filePath: string | null = null;

  if (file) {
    const ext = file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "pdf";
    filePath = `${category === "bulletin" ? "bulletins" : category}/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await admin.storage.from(BUCKET).upload(filePath, buffer, {
      contentType: file.type || "application/pdf",
      upsert: false,
    });
    if (upErr) {
      return NextResponse.json(
        { error: `ファイルのアップロードに失敗しました: ${upErr.message}` },
        { status: 500 }
      );
    }
  }

  const { data, error } = await admin
    .from("member_contents")
    .insert({
      title,
      description,
      category,
      issue_label: issueLabel,
      issue_date: issueDate,
      sort_order: sortOrder,
      file_path: filePath,
      external_url: externalUrl,
      content_type: file ? "application/pdf" : null,
      is_published: isPublished,
    })
    .select("id")
    .single();

  if (error) {
    if (filePath) await admin.storage.from(BUCKET).remove([filePath]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data?.id });
}
