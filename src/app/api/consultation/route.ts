import { NextResponse } from "next/server";
import {
  CONSULTATION_AGES,
  CONSULTATION_CATEGORIES,
  CONSULTATION_TEXT_MAX,
  PUBLIC_NAME_MAX,
  buildOfficeQuestionMail,
  cleanPublicName,
} from "@/lib/consultation";
import { consultationMailReady, officeNotifyAddress, sendConsultationMail } from "@/lib/consultation-mail";
import { clientIpFrom, guardPublicForm, SPAM_MESSAGES_JA } from "@/lib/form-spam";
import { resolvePublicSiteOrigin } from "@/lib/site-public-url";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const publicName = cleanPublicName(String(body.publicName ?? ""));
    const age = String(body.age ?? "").trim();
    const category = String(body.category ?? "").trim();
    const questionBody = String(body.body ?? "").trim();
    const publishWanted = body.publishWanted === true;

    if (!name || !email) {
      return NextResponse.json({ error: "氏名とメールアドレスは必須です。" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
      return NextResponse.json({ error: "有効なメールアドレスを入力してください。" }, { status: 400 });
    }
    if (name.length > 200) {
      return NextResponse.json({ error: "氏名が長すぎます。" }, { status: 400 });
    }
    if (!age || !CONSULTATION_AGES.includes(age as (typeof CONSULTATION_AGES)[number])) {
      return NextResponse.json(
        { error: "年齢は小学生・中学生・高校生のいずれかを選択してください。" },
        { status: 400 }
      );
    }
    if (!category || !CONSULTATION_CATEGORIES.includes(category as (typeof CONSULTATION_CATEGORIES)[number])) {
      return NextResponse.json({ error: "質問の内容を選択してください。" }, { status: 400 });
    }
    if (questionBody.length > CONSULTATION_TEXT_MAX) {
      return NextResponse.json({ error: "質問の詳細が長すぎます。" }, { status: 400 });
    }
    if (publicName.length > PUBLIC_NAME_MAX) {
      return NextResponse.json(
        { error: `HP掲載時のお名前は${PUBLIC_NAME_MAX}文字以内で入力してください。` },
        { status: 400 }
      );
    }
    if (publishWanted && !publicName) {
      return NextResponse.json(
        { error: "HPに掲載する場合は、掲載時のお名前を入力してください。" },
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
        nickname: publicName || null,
        public_name: publicName || null,
        age,
        category,
        body: questionBody || null,
        public_question: questionBody || null,
        publish_wanted: publishWanted,
        consent_status: "not_requested",
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
    await notifyOffice({
      name,
      email,
      publicName,
      publishWanted,
      age,
      category,
      questionBody,
      answerUrl,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[相談室] POST error:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "送信に失敗しました。しばらくしてからお試しください。" },
      { status: 500 }
    );
  }
}

async function notifyOffice(input: {
  name: string;
  email: string;
  publicName: string;
  publishWanted: boolean;
  age: string;
  category: string;
  questionBody: string;
  answerUrl: string;
}) {
  const to = officeNotifyAddress();
  if (!to || !consultationMailReady()) {
    console.error("[相談室] メール設定が不足しているため、事務局への通知を省略しました");
    return;
  }

  const mail = buildOfficeQuestionMail({ ...input, answerUrl: input.answerUrl });
  try {
    await sendConsultationMail({
      to,
      replyTo: input.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
  } catch (e) {
    console.error("[相談室] 通知メールの送信に失敗しました:", e instanceof Error ? e.message : e);
  }
}
