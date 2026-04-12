import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { applicationRowToMailFields } from "@/lib/young-2026-application-mail-html";
import { sendYoungBankTransferReceiptUploadedEmails } from "@/lib/young-2026-bank-mail";

const BUCKET = "competition_transfer_receipts";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Windows 等で file.type が空・octet-stream になる場合に拡張子から推定する */
function resolveImageMime(file: File): string | null {
  const raw = (file.type || "").toLowerCase().trim();
  if (ALLOWED.has(raw)) return raw;
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (raw === "application/octet-stream" || raw === "") return null;
  return null;
}

function userFacingStorageError(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes("bucket not found") ||
    (m.includes("not found") && m.includes("bucket")) ||
    message.includes("バケット")
  ) {
    return "証明画像の保存用ストレージが利用できません。サイト担当者へ連絡するか、しばらくしてから再度お試しください。";
  }
  if (m.includes("row-level security") || m.includes("violates row-level security") || message.includes("RLS")) {
    return "画像の保存がサーバー設定により拒否されました。サイト担当者へお問い合わせください。";
  }
  if (m.includes("payload too large") || m.includes("entity too large") || message.includes("大きすぎ")) {
    return "画像は 5MB 以下にしてください。";
  }
  return "画像の保存に失敗しました。しばらくしてから再度お試しください。";
}

/**
 * 参加費振込の証明（領収書または振込明細など）の画像をアップロードし、申込レコードに紐づける。
 * application_id と email が申込内容と一致する場合のみ許可。
 */
export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "サーバー設定が不足しています。" }, { status: 500 });
    }

    const form = await request.formData();
    const applicationIdRaw = form.get("application_id");
    const emailRaw = form.get("email");
    const applicationId =
      typeof applicationIdRaw === "string" ? applicationIdRaw.trim() : "";
    const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
    const file = form.get("file");

    if (!applicationId || !email || !file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "申込ID・メールアドレス・画像ファイルを指定してください。" },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "画像は 5MB 以下にしてください。" },
        { status: 400 }
      );
    }

    const mime = resolveImageMime(file);
    if (!mime) {
      return NextResponse.json(
        { error: "画像は JPEG・PNG・WebP のいずれかにしてください。" },
        { status: 400 }
      );
    }

    const db = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: row, error: fetchErr } = await db
      .from("applications")
      .select(
        "id, email, name, furigana, birth_date, age_at_reference, member_type, member_number, category, selected_piece_preliminary, selected_piece_final, video_url, accompanist_info, amount, payment_route, transfer_receipt_path, competition_id"
      )
      .eq("id", applicationId)
      .maybeSingle();

    if (fetchErr || !row?.competition_id) {
      return NextResponse.json({ error: "申込が見つかりません。" }, { status: 404 });
    }

    const { data: comp } = await db
      .from("competitions")
      .select("slug")
      .eq("id", row.competition_id)
      .maybeSingle();

    if (comp?.slug !== "young-2026") {
      return NextResponse.json({ error: "申込が見つかりません。" }, { status: 404 });
    }

    const rowEmail = typeof row.email === "string" ? row.email.trim().toLowerCase() : "";
    if (!rowEmail || rowEmail !== email) {
      return NextResponse.json(
        { error: "メールアドレスが申込時のものと一致しません。" },
        { status: 403 }
      );
    }

    const route = (row as { payment_route?: string }).payment_route;
    if (route && route !== "bank_transfer") {
      return NextResponse.json(
        { error: "この申込は銀行振込経路ではありません。" },
        { status: 400 }
      );
    }

    if ((row as { transfer_receipt_path?: string | null }).transfer_receipt_path) {
      return NextResponse.json(
        { error: "すでに証明画像が登録されています。変更が必要な場合は事務局へご連絡ください。" },
        { status: 409 }
      );
    }

    const ext =
      mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
    // オブジェクトキーは ASCII のみ（ストレージ実装・ログでの文字化け回避）
    const objectPath = `young-2026/${applicationId}/${Date.now()}-${randomUUID()}.${ext}`;

    const buf = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await db.storage.from(BUCKET).upload(objectPath, buf, {
      contentType: mime,
      upsert: false,
    });

    if (upErr) {
      console.error("[bank-transfer/receipt] storage upload", {
        message: upErr.message,
        name: (upErr as { name?: string }).name,
      });
      const body: { error: string; debug?: string } = {
        error: userFacingStorageError(upErr.message ?? ""),
      };
      if (process.env.NODE_ENV !== "production") {
        body.debug = upErr.message;
      }
      return NextResponse.json(body, { status: 500 });
    }

    const patch: Record<string, unknown> = {
      transfer_receipt_path: objectPath,
    };

    let up = await db.from("applications").update(patch).eq("id", applicationId).select("id").single();
    if (up.error?.message?.includes("transfer_receipt_path") || up.error?.message?.includes("column")) {
      delete patch.transfer_receipt_path;
      up = await db.from("applications").update(patch).eq("id", applicationId).select("id").single();
      await db.storage.from(BUCKET).remove([objectPath]);
      return NextResponse.json(
        { error: "データベースが未更新です。マイグレーション（transfer_receipt_path）を適用してください。" },
        { status: 500 }
      );
    }

    if (up.error) {
      await db.storage.from(BUCKET).remove([objectPath]);
      return NextResponse.json({ error: up.error.message }, { status: 500 });
    }

    try {
      await sendYoungBankTransferReceiptUploadedEmails({
        email: row.email as string,
        name: String(row.name ?? ""),
        applicationId,
        amount: typeof row.amount === "number" ? row.amount : null,
        applicationFields: applicationRowToMailFields(row as Record<string, unknown>),
      });
    } catch (mailErr) {
      console.error("[bank-transfer/receipt] メール送信エラー（証明画像は保存済み）", mailErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[bank-transfer/receipt]", err);
    return NextResponse.json({ error: "アップロード処理に失敗しました。" }, { status: 500 });
  }
}
