import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyYoung2026MemberCredentials } from "@/lib/young-2026-verify-member";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const member_number = body?.member_number;
    const email = typeof body?.email === "string" ? body.email : "";
    const birth_date = typeof body?.birth_date === "string" ? body.birth_date : "";

    if (!email.trim() || !birth_date.trim()) {
      return NextResponse.json(
        { error: "メールアドレスと生年月日を入力してください。" },
        { status: 400 }
      );
    }
    if (member_number == null || String(member_number).trim() === "") {
      return NextResponse.json({ error: "会員番号を入力してください。" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "会員照合のサーバー設定ができていません。" },
        { status: 500 }
      );
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const result = await verifyYoung2026MemberCredentials(admin, {
      memberNumberRaw: String(member_number),
      email,
      birthDateRaw: birth_date,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message, code: result.code },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[young-2026 verify-member]", err);
    return NextResponse.json(
      { error: "照合処理中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
