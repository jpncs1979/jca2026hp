import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: competition } = await admin
      .from("competitions")
      .select("id")
      .eq("slug", "young-2026")
      .single();

    if (!competition?.id) {
      return NextResponse.json({ applicants: [] });
    }

    const { data: applications, error } = await admin
      .from("applications")
      .select(
        "id, name, furigana, category, selected_piece_preliminary, selected_piece_final, video_url, payment_status, created_at"
      )
      .eq("competition_id", competition.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { applicants: applications ?? [] },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err) {
    console.error("Admin young-2026 API error:", err);
    return NextResponse.json(
      { error: "申込者一覧の取得に失敗しました。" },
      { status: 500 }
    );
  }
}
