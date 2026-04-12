import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

type Body = { payment_status?: string };

/**
 * 銀行振込申込の入金確認（管理者のみ）。
 * 振込証明画像が登録済みの申込のみ「paid」にできる。
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id?.trim()) {
      return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
    }

    const json = (await request.json().catch(() => ({}))) as Body;
    const nextStatus = json.payment_status?.trim();
    if (nextStatus !== "paid" && nextStatus !== "pending") {
      return NextResponse.json(
        { error: "payment_status は paid または pending を指定してください。" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "未認証" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { data: row, error: fetchErr } = await admin
      .from("applications")
      .select("id, payment_route, transfer_receipt_path, payment_status")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !row) {
      return NextResponse.json({ error: "申込が見つかりません。" }, { status: 404 });
    }

    const route = (row as { payment_route?: string | null }).payment_route;
    if (route !== "bank_transfer") {
      return NextResponse.json(
        { error: "銀行振込の申込のみ入金状態を変更できます。" },
        { status: 400 }
      );
    }

    const receiptPath = (row as { transfer_receipt_path?: string | null }).transfer_receipt_path;
    if (nextStatus === "paid" && !receiptPath?.trim()) {
      return NextResponse.json(
        { error: "振込証明画像が登録されていないため、入金済みにできません。" },
        { status: 400 }
      );
    }

    const patch: Record<string, unknown> = {
      payment_status: nextStatus,
      payment_date: nextStatus === "paid" ? new Date().toISOString() : null,
    };

    const { error: upErr } = await admin.from("applications").update(patch).eq("id", id);

    if (upErr) {
      console.error("[admin applications payment-status]", upErr);
      return NextResponse.json({ error: "更新に失敗しました。" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, payment_status: nextStatus });
  } catch (err) {
    console.error("[admin applications payment-status]", err);
    return NextResponse.json({ error: "エラーが発生しました。" }, { status: 500 });
  }
}
