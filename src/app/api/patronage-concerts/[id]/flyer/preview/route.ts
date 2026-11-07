import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/is-current-user-admin";
import { PATRONAGE_FLYER_BUCKET, isPdfFlyer } from "@/lib/patronage-concerts";
import {
  flyerPreviewPath,
  renderPdfFirstPageAsJpeg,
} from "@/lib/patronage-flyer-preview.server";

export const runtime = "nodejs";
export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string }> };

/**
 * チラシの表示用画像。画像のチラシはそのまま、PDF は1ページ目を JPEG にして返す。
 * 公開範囲は元のチラシ（/flyer）と同じ：承認済みは公開、未承認は事務局のみ。
 */
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: row, error } = await admin
      .from("patronage_concerts")
      .select("id, status, flyer_path, flyer_content_type, flyer_filename")
      .eq("id", id)
      .maybeSingle();

    if (error || !row) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }
    if (row.status !== "approved" && !(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }

    const path = row.flyer_path as string | null;
    if (!path) {
      return NextResponse.json({ error: "チラシがありません" }, { status: 404 });
    }

    // 画像のチラシは元のファイルをそのまま使う
    if (!isPdfFlyer(row.flyer_content_type, row.flyer_filename)) {
      const original = new URL(request.url);
      original.pathname = original.pathname.replace(/\/preview$/, "");
      return NextResponse.redirect(original, 307);
    }

    const storage = admin.storage.from(PATRONAGE_FLYER_BUCKET);
    const previewPath = flyerPreviewPath(path);

    let jpeg: Buffer;
    const { data: cached } = await storage.download(previewPath);
    if (cached) {
      jpeg = Buffer.from(await cached.arrayBuffer());
    } else {
      const { data: pdf, error: dlErr } = await storage.download(path);
      if (dlErr || !pdf) {
        console.error("[patronage flyer preview] PDF取得", dlErr);
        return NextResponse.json({ error: "チラシの取得に失敗しました" }, { status: 500 });
      }
      jpeg = await renderPdfFirstPageAsJpeg(new Uint8Array(await pdf.arrayBuffer()));
      const { error: upErr } = await storage.upload(previewPath, jpeg, {
        contentType: "image/jpeg",
        upsert: true,
      });
      if (upErr) {
        // 保存に失敗しても今回の表示はできるので、記録だけ残す
        console.error("[patronage flyer preview] 画像の保存", upErr);
      }
    }

    return new NextResponse(new Uint8Array(jpeg), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control":
          row.status === "approved"
            ? "public, max-age=3600, stale-while-revalidate=86400"
            : "private, no-store",
      },
    });
  } catch (err) {
    console.error("[patronage flyer preview]", err);
    return NextResponse.json({ error: "エラーが発生しました" }, { status: 500 });
  }
}
