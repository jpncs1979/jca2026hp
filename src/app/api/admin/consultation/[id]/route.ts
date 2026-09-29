import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/is-current-user-admin";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await _request.json();
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";
    const publish = body.publish === true;
    const unpublish = body.unpublish === true;

    const admin = createAdminClient();
    const updates: { answer?: string; status: string; published_at?: string | null } = unpublish
      ? { status: "answered", published_at: null }
      : {
          status: publish ? "published" : "answered",
          published_at: publish ? new Date().toISOString() : null,
        };
    if (!unpublish && answer !== undefined) updates.answer = answer;

    const { error } = await admin
      .from("consultation_questions")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("[admin/consultation] PATCH error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/consultation] PATCH error:", e);
    return NextResponse.json({ error: "更新に失敗しました。" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const admin = createAdminClient();
    const { error } = await admin.from("consultation_questions").delete().eq("id", id);
    if (error) {
      console.error("[admin/consultation] DELETE error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/consultation] DELETE error:", e);
    return NextResponse.json({ error: "削除に失敗しました。" }, { status: 500 });
  }
}
