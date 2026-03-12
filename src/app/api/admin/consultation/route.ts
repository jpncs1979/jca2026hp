import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("consultation_questions")
      .select("id, name, email, nickname, age, category, body, status, answer, published_at, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin/consultation] GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("[admin/consultation] GET error:", e);
    return NextResponse.json({ error: "取得に失敗しました。" }, { status: 500 });
  }
}
