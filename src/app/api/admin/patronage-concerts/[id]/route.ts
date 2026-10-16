import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/is-current-user-admin";
import {
  PATRONAGE_FLYER_BUCKET,
  PATRONAGE_SELECT_COLS,
  PATRONAGE_STATUSES,
  parsePatronageConcertEdit,
  type PatronageConcertStatus,
} from "@/lib/patronage-concerts";

type RouteContext = { params: Promise<{ id: string }> };

function revalidateListing(slug?: string | null) {
  revalidatePath("/members/supported-concerts");
  revalidatePath("/members/supported-concerts", "layout");
  if (slug) revalidatePath(`/members/supported-concerts/${slug}`);
}

/** 事務局: 申請内容の修正、または承認 / 却下 / 掲載取り下げ */
export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const admin = createAdminClient();

  if (body.content != null) {
    const parsed = parsePatronageConcertEdit(body.content);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { data: existing, error: exErr } = await admin
      .from("patronage_concerts")
      .select("id, slug")
      .eq("id", id)
      .maybeSingle();
    if (exErr || !existing) {
      return NextResponse.json({ error: "申請が見つかりません" }, { status: 404 });
    }

    const { data: updated, error } = await admin
      .from("patronage_concerts")
      .update({
        ...parsed.value,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(PATRONAGE_SELECT_COLS)
      .single();
    if (error || !updated) {
      return NextResponse.json({ error: error?.message ?? "更新に失敗しました" }, { status: 500 });
    }

    revalidateListing(existing.slug as string);
    return NextResponse.json({ item: updated });
  }

  const status = String(body.status ?? "") as PatronageConcertStatus;
  if (!PATRONAGE_STATUSES.includes(status)) {
    return NextResponse.json({ error: "不正な状態です" }, { status: 400 });
  }

  const { data: existing, error: exErr } = await admin
    .from("patronage_concerts")
    .select("id, slug, status")
    .eq("id", id)
    .maybeSingle();

  if (exErr || !existing) {
    return NextResponse.json({ error: "申請が見つかりません" }, { status: 404 });
  }

  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "approved") {
    update.approved_at = new Date().toISOString();
  }

  const { error } = await admin.from("patronage_concerts").update(update).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateListing(existing.slug as string);
  return NextResponse.json({ success: true });
}

/** 事務局: 申請を削除（チラシも削除） */
export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await context.params;
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("patronage_concerts")
    .select("flyer_path")
    .eq("id", id)
    .maybeSingle();

  const { error } = await admin.from("patronage_concerts").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (existing?.flyer_path) {
    await admin.storage.from(PATRONAGE_FLYER_BUCKET).remove([existing.flyer_path]);
  }

  revalidateListing();
  return NextResponse.json({ success: true });
}
