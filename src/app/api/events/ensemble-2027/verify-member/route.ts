import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyEnsemble2027Member } from "@/lib/ensemble-2027-verify-member";

/** アンコン会員照合：会員1名の氏名・メール・生年月日（会員番号は使わない） */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const name = typeof body.member_name === "string" ? body.member_name : "";
    const email = typeof body.member_email === "string" ? body.member_email : "";
    const birth = typeof body.birth_date === "string" ? body.birth_date : "";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "会員照合のサーバー設定ができていません。" }, { status: 500 });
    }

    const result = await verifyEnsemble2027Member(createClient(supabaseUrl, serviceRoleKey), {
      name,
      email,
      birthDateRaw: birth,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Ensemble verify-member error:", err);
    return NextResponse.json({ error: "会員情報の確認に失敗しました。" }, { status: 500 });
  }
}
