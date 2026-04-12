import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createYoung2026Application } from "@/lib/young-2026-create-application";
import { sendYoungBankTransferPendingEmails } from "@/lib/young-2026-bank-mail";

/**
 * ヤングコンクール: 銀行振込・郵便振替を選んだ場合の申込レコード作成（カード決済は行わない）
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const clientOrigin =
      typeof body._client_origin === "string" ? body._client_origin : undefined;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "サーバー設定が不足しています（SUPABASE_SERVICE_ROLE_KEY）。" },
        { status: 500 }
      );
    }

    const db = createClient(supabaseUrl, serviceRoleKey);
    const created = await createYoung2026Application(db, body, "bank_transfer");
    if (!created.ok) {
      return NextResponse.json(
        { error: created.message },
        { status: created.status ?? 400 }
      );
    }

    try {
      await sendYoungBankTransferPendingEmails(
        request,
        created.parsed,
        created.applicationId,
        created.amount,
        { clientOrigin }
      );
    } catch (mailErr) {
      console.error("[ヤング振込申込] メール送信エラー（申込は保存済み）", mailErr);
    }

    return NextResponse.json({
      application_id: created.applicationId,
      amount: created.amount,
    });
  } catch (err) {
    console.error("[bank-transfer/register]", err);
    return NextResponse.json(
      { error: "申込の処理中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
