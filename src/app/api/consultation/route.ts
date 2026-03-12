import { NextResponse } from "next/server";
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

    const admin = createAdminClient();
    const { error } = await admin.from("consultation_questions").insert({
      name,
      email,
      nickname: nickname || null,
      age: age || null,
      category,
      body: questionBody || null,
      status: "pending",
    });

    if (error) {
      console.error("[相談室] insert error:", error);
      return NextResponse.json(
        { error: "送信に失敗しました。しばらくしてからお試しください。" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[相談室] POST error:", e);
    return NextResponse.json(
      { error: "送信に失敗しました。しばらくしてからお試しください。" },
      { status: 500 }
    );
  }
}
