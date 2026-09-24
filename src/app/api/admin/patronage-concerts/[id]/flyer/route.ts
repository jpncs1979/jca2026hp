import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/is-current-user-admin";
import {
  PATRONAGE_FLYER_BUCKET,
  PATRONAGE_SELECT_COLS,
  flyerContentType,
  flyerExtension,
  flyerFileError,
} from "@/lib/patronage-concerts";

type RouteContext = { params: Promise<{ id: string }> };

function revalidateListing() {
  revalidatePath("/members/supported-concerts");
  revalidatePath("/members/supported-concerts", "layout");
}

/** 事務局: 後から届いたチラシを登録・差し替え */
export async function POST(request: Request, context: RouteContext) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await context.params;
  const formData = await request.formData().catch(() => null);
  const flyer = formData?.get("flyer");
  if (!(flyer instanceof File) || flyer.size <= 0 || !flyer.name) {
    return NextResponse.json({ error: "チラシファイルを選択してください。" }, { status: 400 });
  }
  const flyerErr = flyerFileError(flyer);
  if (flyerErr) {
    return NextResponse.json({ error: flyerErr }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing, error: exErr } = await admin
    .from("patronage_concerts")
    .select("id, flyer_path")
    .eq("id", id)
    .maybeSingle();
  if (exErr || !existing) {
    return NextResponse.json({ error: "申請が見つかりません" }, { status: 404 });
  }

  const ext = flyerExtension(flyer.name, flyer.type)!;
  const flyerPath = `${id}/${randomUUID()}.${ext}`;
  const contentType = flyerContentType(ext, flyer.type);
  const buffer = Buffer.from(await flyer.arrayBuffer());

  const { error: upErr } = await admin.storage
    .from(PATRONAGE_FLYER_BUCKET)
    .upload(flyerPath, buffer, { contentType, upsert: false });
  if (upErr) {
    console.error("[後援チラシ] アップロード", upErr);
    return NextResponse.json({ error: "チラシの保存に失敗しました。" }, { status: 500 });
  }

  const { data: updated, error: updErr } = await admin
    .from("patronage_concerts")
    .update({
      flyer_path: flyerPath,
      flyer_content_type: contentType,
      flyer_filename: flyer.name,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(PATRONAGE_SELECT_COLS)
    .single();

  if (updErr || !updated) {
    await admin.storage.from(PATRONAGE_FLYER_BUCKET).remove([flyerPath]);
    return NextResponse.json(
      { error: updErr?.message ?? "チラシの登録に失敗しました。" },
      { status: 500 }
    );
  }

  const previous = existing.flyer_path as string | null;
  if (previous && previous !== flyerPath) {
    await admin.storage.from(PATRONAGE_FLYER_BUCKET).remove([previous]);
  }

  revalidateListing();
  return NextResponse.json({ item: updated });
}
