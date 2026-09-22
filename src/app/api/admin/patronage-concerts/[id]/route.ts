import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/is-current-user-admin";
import {
  PATRONAGE_FLYER_BUCKET,
  PATRONAGE_STATUSES,
  type PatronageConcertStatus,
} from "@/lib/patronage-concerts";

type RouteContext = { params: Promise<{ id: string }> };

function revalidateListing() {
  revalidatePath("/members/supported-concerts");
  revalidatePath("/members/supported-concerts", "layout");
}

/** 事務局: 承認 / 却下 / 掲載取り下げ */
export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const status = String(body.status ?? "") as PatronageConcertStatus;
  if (!PATRONAGE_STATUSES.includes(status)) {
    return NextResponse.json({ error: "不正な状態です" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing, error: exErr } = await admin
    .from("patronage_concerts")
    .select("id, status")
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

  revalidateListing();
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
