import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getFromHeader } from "@/lib/email";

const FIELDS: { key: string; label: string }[] = [
  { key: "name", label: "お名前" },
  { key: "email", label: "メールアドレス" },
  { key: "member_number", label: "会員番号" },
  { key: "concert_title", label: "演奏会表題" },
  { key: "event_date", label: "期日" },
  { key: "doors_open", label: "開場時刻" },
  { key: "curtain_time", label: "開演時刻" },
  { key: "venue", label: "場所" },
  { key: "admission", label: "入場料" },
  { key: "performers", label: "出演者" },
  { key: "program", label: "曲目" },
  { key: "organizer", label: "主催" },
  { key: "contact", label: "問い合わせ先" },
  { key: "consent_destination", label: "承諾書の送り先" },
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
    if (!name || !email) {
      return NextResponse.json(
        { error: "お名前とメールアドレスは必須です。" },
        { status: 400 }
      );
    }

    const emailUser = process.env.EMAIL_USER;
    const emailAppPassword = process.env.EMAIL_APP_PASSWORD;
    const officeNotifyEmail = process.env.OFFICE_NOTIFY_EMAIL || emailUser;

    if (!emailUser || !emailAppPassword || !officeNotifyEmail) {
      console.error("[後援依頼] メール設定が不足しています");
      return NextResponse.json(
        { error: "送信設定のため、しばらくしてからお試しください。" },
        { status: 500 }
      );
    }

    const htmlRows = FIELDS.map(
      ({ key, label }) => `<tr><td style="vertical-align:top;padding:6px 12px 6px 0;font-weight:600;">${escapeHtml(label)}</td><td style="padding:6px 0;">${escapeHtml(body[key] ?? "—")}</td></tr>`
    ).join("");

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <p>ウェブサイトの「後援依頼」フォームから以下の内容が送信されました。</p>
  <table style="border-collapse:collapse;">
    ${htmlRows}
  </table>
  <hr />
  <p style="color:#666;font-size:12px;">一般社団法人 日本クラリネット協会 後援依頼フォーム</p>
</body>
</html>`;

    const flyer = formData.get("flyer") as File | null;
    const attachments: { filename: string; content: Buffer }[] = [];
    if (flyer && flyer.size > 0 && flyer.name) {
      const buf = Buffer.from(await flyer.arrayBuffer());
      attachments.push({ filename: flyer.name, content: buf });
    }

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
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[後援依頼] 送信エラー:", err);
    return NextResponse.json(
      { error: "送信に失敗しました。しばらくしてからお試しください。" },
      { status: 500 }
    );
  }
}
