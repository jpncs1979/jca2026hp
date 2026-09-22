import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/is-current-user-admin";
import { PATRONAGE_FLYER_BUCKET } from "@/lib/patronage-concerts";

type RouteContext = { params: Promise<{ id: string }> };

/** 承認済み公演のチラシは公開。未承認は事務局のみ。 */
export async function GET(_request: Request, context: RouteContext) {
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

    if (row.status !== "approved") {
      if (!(await isCurrentUserAdmin())) {
        return NextResponse.json({ error: "見つかりません" }, { status: 404 });
      }
    }

    const path = row.flyer_path as string | null;
    if (!path) {
      return NextResponse.json({ error: "チラシがありません" }, { status: 404 });
    }

    const { data: file, error: dlErr } = await admin.storage
      .from(PATRONAGE_FLYER_BUCKET)
      .download(path);
    if (dlErr || !file) {
      console.error("[patronage flyer]", dlErr);
      return NextResponse.json({ error: "チラシの取得に失敗しました" }, { status: 500 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const contentType =
      (row.flyer_content_type as string | null) || file.type || "application/octet-stream";
    const filename = (row.flyer_filename as string | null) || "flyer";
    const isPdf = contentType.includes("pdf") || filename.toLowerCase().endsWith(".pdf");

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${isPdf ? "inline" : "inline"}; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control":
          row.status === "approved"
            ? "public, max-age=3600, stale-while-revalidate=86400"
            : "private, no-store",
      },
    });
  } catch (err) {
    console.error("[patronage flyer]", err);
    return NextResponse.json({ error: "エラーが発生しました" }, { status: 500 });
  }
}
