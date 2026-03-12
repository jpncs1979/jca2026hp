import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await _request.json();
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";
    const publish = body.publish === true;

    const admin = createAdminClient();
    const updates: { answer?: string; status: string; published_at?: string } = {
      status: publish ? "published" : "answered",
    };
    if (answer !== undefined) updates.answer = answer;
    if (publish) updates.published_at = new Date().toISOString();

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
