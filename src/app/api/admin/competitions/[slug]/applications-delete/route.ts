import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ slug: string }> };

const BUCKET = "competition_transfer_receipts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Body = { application_ids?: unknown };

/**
 * 指定コンクールの申込を一括削除（管理者のみ）。
 * 振込証明画像がある場合は Storage からも削除する。
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const slugTrim = slug?.trim();
    if (!slugTrim) {
      return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
    }

    let body: Body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON ボディが必要です。" }, { status: 400 });
    }

    const rawIds = body.application_ids;
    if (!Array.isArray(rawIds) || rawIds.length === 0) {
      return NextResponse.json(
        { error: "application_ids に削除する申込IDの配列を指定してください。" },
        { status: 400 }
      );
    }

    const ids = [...new Set(rawIds.map((x) => String(x).trim()).filter(Boolean))];
    if (ids.length > 200) {
      return NextResponse.json({ error: "一度に削除できるのは 200 件までです。" }, { status: 400 });
    }

    for (const id of ids) {
      if (!UUID_RE.test(id)) {
        return NextResponse.json({ error: `無効な申込IDです: ${id}` }, { status: 400 });
      }
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

    const { data: competition, error: compErr } = await admin
      .from("competitions")
      .select("id")
      .eq("slug", slugTrim)
      .maybeSingle();

    if (compErr || !competition?.id) {
      return NextResponse.json({ error: "コンクールが見つかりません。" }, { status: 404 });
    }

    const compId = competition.id as string;

    const { data: rows, error: fetchErr } = await admin
      .from("applications")
      .select("id, transfer_receipt_path")
      .eq("competition_id", compId)
      .in("id", ids);

    if (fetchErr) {
      console.error("[applications-delete] fetch", fetchErr);
      return NextResponse.json({ error: "申込の確認に失敗しました。" }, { status: 500 });
    }

    const found = rows ?? [];
    if (found.length !== ids.length) {
      const foundSet = new Set(found.map((r: { id: string }) => r.id));
      const missing = ids.filter((id) => !foundSet.has(id));
      return NextResponse.json(
        {
          error: "指定された申込の一部が見つからないか、このコンクールに属しません。",
          missing_ids: missing,
        },
        { status: 400 }
      );
    }

    const paths = found
      .map((r: { transfer_receipt_path?: string | null }) =>
        typeof r.transfer_receipt_path === "string" ? r.transfer_receipt_path.trim() : ""
      )
      .filter(Boolean);

    if (paths.length > 0) {
      const { error: stErr } = await admin.storage.from(BUCKET).remove(paths);
      if (stErr) {
        console.error("[applications-delete] storage", stErr);
        return NextResponse.json(
          { error: "振込証明画像の削除に失敗しました。ストレージを確認してください。" },
          { status: 500 }
        );
      }
    }

    const { error: delErr } = await admin
      .from("applications")
      .delete()
      .eq("competition_id", compId)
      .in("id", ids);

    if (delErr) {
      console.error("[applications-delete] delete", delErr);
      return NextResponse.json({ error: "申込の削除に失敗しました。" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, deleted: ids.length });
  } catch (err) {
    console.error("[applications-delete]", err);
    return NextResponse.json({ error: "処理中にエラーが発生しました。" }, { status: 500 });
  }
}
