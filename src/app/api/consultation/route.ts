import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getFromHeader } from "@/lib/email";
import { resolvePublicSiteOrigin } from "@/lib/site-public-url";
import { clientIpFrom, guardPublicForm, SPAM_MESSAGES_JA } from "@/lib/form-spam";
import { createAdminClient } from "@/lib/supabase/server";

const CATEGORIES = [
  "音が出ない、どうして？どうしよう",
  "リードはどうしたらよいの？",
  "奏法について（アンブシュア、呼吸）",
  "楽器について",
  "特殊管について",
  "その他",
] as const;

const AGES = ["小学生", "中学生", "高校生"] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const nickname = String(body.nickname ?? "").trim();
    const age = String(body.age ?? "").trim();
    const category = String(body.category ?? "").trim();
    const questionBody = String(body.body ?? "").trim();

    if (!name || !email) {
      return NextResponse.json(
        { error: "氏名とメールアドレスは必須です。" },
        { status: 400 }
      );
    }
    if (!age || !AGES.includes(age as (typeof AGES)[number])) {
      return NextResponse.json(
        { error: "年齢は小学生・中学生・高校生のいずれかを選択してください。" },
        { status: 400 }
      );
    }
    if (!category || !CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
      return NextResponse.json(
        { error: "質問の内容を選択してください。" },
        { status: 400 }
      );
    }
    if (questionBody.length > 15_000) {
      return NextResponse.json(
        { error: "質問の詳細が長すぎます。" },
        { status: 400 }
      );
    }

    const spam = await guardPublicForm({
      honeypot: body.company_website,
      startedAt: body.startedAt,
      message: questionBody || category,
      turnstileToken: body.turnstileToken,
      remoteIp: clientIpFrom(request),
      messages: SPAM_MESSAGES_JA,
    });
    if (!spam.ok) {
      if (spam.silent) {
        console.info("[相談室] spam dropped:", spam.reason);
        return NextResponse.json({ ok: true });
      }
      return NextResponse.json({ error: spam.error }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: inserted, error } = await admin
      .from("consultation_questions")
      .insert({
        name,
        email,
        nickname: nickname || null,
        age: age || null,
        category,
        body: questionBody || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (error || !inserted?.id) {
      console.error("[相談室] insert error:", error);
      return NextResponse.json(
        { error: "送信に失敗しました。しばらくしてからお試しください。" },
        { status: 500 }
      );
    }

    const answerUrl = `${resolvePublicSiteOrigin(request)}/admin/consultation?id=${inserted.id}`;
    await notifyOffice({ name, email, nickname, age, category, questionBody, answerUrl });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[相談室] POST error:", e);
    return NextResponse.json(
      { error: "送信に失敗しました。しばらくしてからお試しください。" },
      { status: 500 }
    );
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
}

async function notifyOffice(input: {
  name: string;
  email: string;
  nickname: string;
  age: string;
  category: string;
  questionBody: string;
  answerUrl: string;
}) {
  const emailUser = process.env.EMAIL_USER;
  const emailAppPassword = process.env.EMAIL_APP_PASSWORD;
  const officeNotifyEmail = process.env.OFFICE_NOTIFY_EMAIL || emailUser;
  if (!emailUser || !emailAppPassword || !officeNotifyEmail) {
    console.error("[相談室] メール設定が不足しているため、事務局への通知を省略しました");
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <p>クラリネット相談室に質問が届きました。</p>
  <p><a href="${escapeHtml(input.answerUrl)}">事務局画面で回答する</a></p>
  <table style="border-collapse:collapse;">
    <tr><td style="vertical-align:top;padding:6px 12px 6px 0;font-weight:600;">氏名</td><td style="padding:6px 0;">${escapeHtml(input.name)}</td></tr>
    <tr><td style="vertical-align:top;padding:6px 12px 6px 0;font-weight:600;">メールアドレス</td><td style="padding:6px 0;">${escapeHtml(input.email)}</td></tr>
    <tr><td style="vertical-align:top;padding:6px 12px 6px 0;font-weight:600;">ニックネーム</td><td style="padding:6px 0;">${escapeHtml(input.nickname || "（なし）")}</td></tr>
    <tr><td style="vertical-align:top;padding:6px 12px 6px 0;font-weight:600;">年齢</td><td style="padding:6px 0;">${escapeHtml(input.age)}</td></tr>
    <tr><td style="vertical-align:top;padding:6px 12px 6px 0;font-weight:600;">内容</td><td style="padding:6px 0;">${escapeHtml(input.category)}</td></tr>
    <tr><td style="vertical-align:top;padding:6px 12px 6px 0;font-weight:600;">詳細</td><td style="padding:6px 0;">${escapeHtml(input.questionBody || "（なし）")}</td></tr>
  </table>
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
      replyTo: input.email,
      subject: `【クラリネット相談室】${input.category.slice(0, 40)}`,
      html,
    });
  } catch (e) {
    console.error("[相談室] 通知メールの送信に失敗しました:", e);
  }
}
