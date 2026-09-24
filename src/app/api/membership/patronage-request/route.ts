import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import nodemailer from "nodemailer";
import { getFromHeader } from "@/lib/email";
import { normalizeMemberNumberInput } from "@/lib/member-number";
import { createAdminClient } from "@/lib/supabase/server";
import { resolvePublicSiteOrigin } from "@/lib/site-public-url";
import {
  PATRONAGE_FLYER_BUCKET,
  flyerContentType,
  flyerExtension,
  flyerFileError,
} from "@/lib/patronage-concerts";

export const runtime = "nodejs";

const FIELDS: { key: string; label: string; required?: boolean }[] = [
  { key: "name", label: "お名前", required: true },
  { key: "email", label: "メールアドレス", required: true },
  { key: "member_number", label: "会員番号" },
  { key: "concert_title", label: "演奏会表題", required: true },
  { key: "event_date", label: "期日", required: true },
  { key: "doors_open", label: "開場時刻", required: true },
  { key: "curtain_time", label: "開演時刻", required: true },
  { key: "venue", label: "場所", required: true },
  { key: "admission", label: "入場料", required: true },
  { key: "performers", label: "出演者", required: true },
  { key: "program", label: "曲目", required: true },
  { key: "organizer", label: "主催", required: true },
  { key: "contact", label: "問い合わせ先", required: true },
  { key: "consent_destination", label: "承諾書の送り先", required: true },
  { key: "notes", label: "備考" },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const body: Record<string, string> = {};
    for (const { key } of FIELDS) {
      const v = formData.get(key);
      if (v != null && typeof v === "string") body[key] = v.trim();
    }

    const name = body.name ?? "";
    const email = body.email ?? "";
    const rawMn = body.member_number?.trim() ?? "";
    if (rawMn) {
      const n = normalizeMemberNumberInput(rawMn);
      body.member_number = n ?? rawMn;
    }

    for (const { key, label, required } of FIELDS) {
      if (required && !body[key]) {
        return NextResponse.json(
          { error: `${label}を入力してください。` },
          { status: 400 }
        );
      }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "有効なメールアドレスを入力してください。" },
        { status: 400 }
      );
    }

    if (!isIsoDate(body.event_date ?? "")) {
      return NextResponse.json(
        { error: "期日はカレンダーから選択してください。" },
        { status: 400 }
      );
    }

    const flyerRaw = formData.get("flyer");
    const flyer =
      flyerRaw instanceof File && flyerRaw.size > 0 && flyerRaw.name ? flyerRaw : null;
    if (flyerRaw instanceof File && flyerRaw.name && !flyer) {
      return NextResponse.json({ error: "チラシファイルが空です。" }, { status: 400 });
    }
    if (flyer) {
      const flyerErr = flyerFileError(flyer);
      if (flyerErr) {
        return NextResponse.json({ error: flyerErr }, { status: 400 });
      }
    }

    const admin = createAdminClient();
    const id = randomUUID();
    const slug = `${body.event_date}-${id.slice(0, 8)}`;
    let flyerPath: string | null = null;
    let flyerBuffer: Buffer | null = null;
    let contentType: string | null = null;

    if (flyer) {
      const ext = flyerExtension(flyer.name, flyer.type)!;
      flyerPath = `${id}/${randomUUID()}.${ext}`;
      flyerBuffer = Buffer.from(await flyer.arrayBuffer());
      contentType = flyerContentType(ext, flyer.type);

      const { error: upErr } = await admin.storage
        .from(PATRONAGE_FLYER_BUCKET)
        .upload(flyerPath, flyerBuffer, { contentType, upsert: false });
      if (upErr) {
        console.error("[後援依頼] チラシアップロード", upErr);
        return NextResponse.json(
          { error: "チラシの保存に失敗しました。しばらくしてからお試しください。" },
          { status: 500 }
        );
      }
    }

    const { error: insErr } = await admin.from("patronage_concerts").insert({
      id,
      slug,
      applicant_name: name,
      applicant_email: email,
      member_number: body.member_number || null,
      concert_title: body.concert_title,
      event_date: body.event_date,
      doors_open: body.doors_open,
      curtain_time: body.curtain_time,
      venue: body.venue,
      admission: body.admission,
      performers: body.performers,
      program: body.program,
      organizer: body.organizer,
      contact: body.contact,
      consent_destination: body.consent_destination,
      notes: body.notes || null,
      flyer_path: flyerPath,
      flyer_content_type: contentType,
      flyer_filename: flyer?.name ?? null,
      status: "pending",
    });

    if (insErr) {
      if (flyerPath) {
        await admin.storage.from(PATRONAGE_FLYER_BUCKET).remove([flyerPath]);
      }
      console.error("[後援依頼] DB保存", insErr);
      return NextResponse.json(
        { error: "送信に失敗しました。しばらくしてからお試しください。" },
        { status: 500 }
      );
    }

    const emailUser = process.env.EMAIL_USER;
    const emailAppPassword = process.env.EMAIL_APP_PASSWORD;
    const officeNotifyEmail = process.env.OFFICE_NOTIFY_EMAIL || emailUser;

    if (emailUser && emailAppPassword && officeNotifyEmail) {
      const origin = resolvePublicSiteOrigin(request);
      const adminUrl = `${origin}/admin/patronage-concerts`;
      const htmlRows = FIELDS.map(
        ({ key, label }) =>
          `<tr><td style="vertical-align:top;padding:6px 12px 6px 0;font-weight:600;">${escapeHtml(label)}</td><td style="padding:6px 0;">${escapeHtml(body[key] ?? "—")}</td></tr>`
      ).join("");

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <p>ウェブサイトの「後援依頼」フォームから新しい申請が届きました。</p>
  <p>事務局管理画面で内容を確認し、<strong>承認</strong>すると後援演奏会のご案内ページに掲載されます。</p>
  <p><a href="${escapeHtml(adminUrl)}">後援申請の管理画面を開く</a></p>
  <table style="border-collapse:collapse;">
    ${htmlRows}
  </table>
  <p>チラシ: ${
    flyer
      ? escapeHtml(flyer.name)
      : "未添付。できあがり次第、申請者から事務局へ送付されます。管理画面から登録してください。"
  }</p>
  <hr />
  <p style="color:#666;font-size:12px;">一般社団法人 日本クラリネット協会 後援依頼フォーム</p>
</body>
</html>`;

      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: emailUser,
            pass: emailAppPassword.replace(/\s/g, ""),
          },
        });
        await transporter.sendMail({
          from: getFromHeader(),
          to: officeNotifyEmail,
          replyTo: email || undefined,
          subject: `【後援依頼】${(body.concert_title || "演奏会").slice(0, 40)} - ${name}`,
          html,
          ...(flyer && flyerBuffer
            ? { attachments: [{ filename: flyer.name, content: flyerBuffer }] }
            : {}),
        });
      } catch (mailErr) {
        console.error("[後援依頼] メール送信エラー（申請自体は保存済み）:", mailErr);
      }
    } else {
      console.error("[後援依頼] メール設定が不足しています（申請自体は保存済み）");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[後援依頼] 送信エラー:", err);
    return NextResponse.json(
      { error: "送信に失敗しました。しばらくしてからお試しください。" },
      { status: 500 }
    );
  }
}
