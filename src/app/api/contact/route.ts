import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getFromHeader } from "@/lib/email";

const MAX_BODY = 15_000;

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
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!name || !email) {
      return NextResponse.json(
        { error: "氏名とメールアドレスは必須です。" },
        { status: 400 }
      );
    }
    if (!message) {
      return NextResponse.json(
        { error: "問い合わせ内容を入力してください。" },
        { status: 400 }
      );
    }
    if (message.length > MAX_BODY) {
      return NextResponse.json(
        { error: "問い合わせ内容が長すぎます。" },
        { status: 400 }
      );
    }

    const emailUser = process.env.EMAIL_USER;
    const emailAppPassword = process.env.EMAIL_APP_PASSWORD;
    const officeNotifyEmail = process.env.OFFICE_NOTIFY_EMAIL || emailUser;

    if (!emailUser || !emailAppPassword || !officeNotifyEmail) {
      console.error("[お問い合わせ] メール設定が不足しています");
      return NextResponse.json(
        { error: "送信設定のため、しばらくしてからお試しください。" },
        { status: 500 }
      );
    }

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <p>ウェブサイトの「お問い合わせ」フォームから以下の内容が送信されました。</p>
  <table style="border-collapse:collapse;">
    <tr><td style="vertical-align:top;padding:6px 12px 6px 0;font-weight:600;">氏名</td><td style="padding:6px 0;">${escapeHtml(name)}</td></tr>
    <tr><td style="vertical-align:top;padding:6px 12px 6px 0;font-weight:600;">メールアドレス</td><td style="padding:6px 0;">${escapeHtml(email)}</td></tr>
    <tr><td style="vertical-align:top;padding:6px 12px 6px 0;font-weight:600;">問い合わせ内容</td><td style="padding:6px 0;">${escapeHtml(message)}</td></tr>
  </table>
  <hr />
  <p style="color:#666;font-size:12px;">一般社団法人 日本クラリネット協会 お問い合わせフォーム</p>
</body>
</html>`;

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
      replyTo: email,
      subject: `【お問い合わせ】${name.slice(0, 40)}`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[お問い合わせ] POST error:", e);
    return NextResponse.json(
      { error: "送信に失敗しました。しばらくしてからお試しください。" },
      { status: 500 }
    );
  }
}
