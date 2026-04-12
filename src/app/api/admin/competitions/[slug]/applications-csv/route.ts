import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { buildCompetitionApplicationsCsvContent } from "@/lib/admin-competition-applications-csv";

type RouteContext = { params: Promise<{ slug: string }> };

const SELECT_FULL =
  "id, profile_id, name, furigana, email, birth_date, age_at_reference, member_type, member_number, category, selected_piece_preliminary, selected_piece_final, video_url, accompanist_info, amount, payment_status, payment_date, payment_route, transfer_receipt_path, created_at";

const SELECT_FALLBACK =
  "id, profile_id, name, furigana, email, birth_date, age_at_reference, member_type, member_number, category, selected_piece_preliminary, selected_piece_final, video_url, accompanist_info, amount, payment_status, payment_date, created_at";

/**
 * 指定コンクールの申込一覧を UTF-8 CSV で一括ダウンロード（管理者のみ）
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const slugTrim = slug?.trim();
    if (!slugTrim) {
      return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
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

    let { data: rows, error } = await admin
      .from("applications")
      .select(SELECT_FULL)
      .eq("competition_id", competition.id)
      .order("created_at", { ascending: false });

    if (
      error &&
      (error.message?.includes("payment_route") ||
        error.message?.includes("transfer_receipt_path") ||
        error.message?.includes("column"))
    ) {
      const retry = await admin
        .from("applications")
        .select(SELECT_FALLBACK)
        .eq("competition_id", competition.id)
        .order("created_at", { ascending: false });
      rows = (retry.data ?? []).map((r: Record<string, unknown>) => ({
        ...r,
        payment_route: null,
        transfer_receipt_path: null,
      }));
      error = retry.error;
    }

    if (error) {
      console.error("[applications-csv]", error);
      return NextResponse.json({ error: "データの取得に失敗しました。" }, { status: 500 });
    }

    const list = (rows ?? []) as Record<string, unknown>[];
    const csv = buildCompetitionApplicationsCsvContent(list, slugTrim);
    const bom = "\uFEFF";
    const date = new Date().toISOString().slice(0, 10);
    const safeSlug = slugTrim.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `${safeSlug}_applications_${list.length}rows_${date}.csv`;

    return new NextResponse(bom + csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[applications-csv]", err);
    return NextResponse.json({ error: "CSV の生成に失敗しました。" }, { status: 500 });
  }
}
