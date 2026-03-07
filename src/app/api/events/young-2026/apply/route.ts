import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { YOUNG_2026 } from "@/lib/young-2026";

const OFFICE_EMAIL = "jpncs1979@gmail.com";

function buildApplicationText(data: {
  name: string;
  furigana: string;
  email: string;
  birth_date: string;
  member_type: string;
  member_number?: string;
  category: string;
  selected_piece_preliminary?: string;
  selected_piece_final?: string;
  video_url?: string;
  accompanist_info?: string;
}) {
  const lines: string[] = [
    `【${YOUNG_2026.name} 申込内容】`,
    "",
    `お名前：${data.name}`,
    `ふりがな：${data.furigana}`,
    `メールアドレス：${data.email}`,
    `生年月日：${data.birth_date}`,
    `会員種別：${data.member_type}`,
    ...(data.member_number ? [`会員番号：${data.member_number}`] : []),
    `部門：${data.category}`,
    ...(data.selected_piece_preliminary ? [`予選課題曲：${data.selected_piece_preliminary}`] : []),
    ...(data.selected_piece_final ? [`本選課題曲：${data.selected_piece_final}`] : []),
    ...(data.video_url ? [`予選動画URL：${data.video_url}`] : []),
    ...(data.accompanist_info ? [`伴奏者・備考：${data.accompanist_info}`] : []),
  ];
  return lines.join("\n");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      furigana,
      email,
      birth_date,
      member_type,
      member_number,
      category,
      selected_piece_preliminary,
      selected_piece_final,
      video_url,
      accompanist_info,
    } = body;

    if (!name || !furigana || !email || !birth_date || !member_type || !category) {
      return NextResponse.json(
        { error: "必須項目が入力されていません。" },
        { status: 400 }
      );
    }

    const birth = new Date(birth_date);
    if (isNaN(birth.getTime())) {
      return NextResponse.json(
        { error: "生年月日が不正です。" },
        { status: 400 }
      );
    }

    const refDate = new Date(YOUNG_2026.referenceDate);
    let age = refDate.getFullYear() - birth.getFullYear();
    const m = refDate.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && refDate.getDate() < birth.getDate())) age--;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "サーバー設定が完了していません。" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: comp } = await supabase
      .from("competitions")
      .select("id")
      .eq("slug", YOUNG_2026.slug)
      .single();

    if (!comp?.id) {
      return NextResponse.json(
        { error: "申込の準備ができていません。" },
        { status: 500 }
      );
    }

    const { error: insertError } = await supabase.from("applications").insert({
      competition_id: comp.id,
      name,
      furigana,
      email,
      birth_date,
      age_at_reference: age,
      member_type,
      member_number: member_type === "会員" ? member_number || null : null,
      category,
      selected_piece_preliminary: selected_piece_preliminary || null,
      selected_piece_final:
        category === "ジュニアB" || category === "ヤング"
          ? selected_piece_final || null
          : null,
      video_url:
        YOUNG_2026.requiresVideo.includes(category as "ジュニアA" | "ジュニアB")
          ? video_url || null
          : null,
      accompanist_info: accompanist_info || null,
      payment_status: "pending",
    });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    const appText = buildApplicationText({
      name,
      furigana,
      email,
      birth_date,
      member_type,
      member_number,
      category,
      selected_piece_preliminary,
      selected_piece_final,
      video_url,
      accompanist_info,
    });

    const emailUser = process.env.EMAIL_USER;
    const emailAppPassword = process.env.EMAIL_APP_PASSWORD;

    if (emailUser && emailAppPassword) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: emailUser,
          pass: emailAppPassword.replace(/\s/g, ""), // スペースを除去
        },
      });

      const participantSubject = `${YOUNG_2026.name} 申込受付のお知らせ`;
      const participantHtml = `
        <p>${name} 様</p>
        <p>この度は${YOUNG_2026.name}にお申し込みいただき、ありがとうございます。</p>
        <p>以下の内容で申込を受付いたしました。</p>
        <pre style="white-space: pre-wrap; font-family: sans-serif; background: #f5f5f5; padding: 1em; border-radius: 4px;">${appText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
        <p>参加料の入金を確認した時点で受付完了となります。振込方法は要項をご確認ください。</p>
        <p>ご不明な点がございましたら、事務局までお問い合わせください。</p>
        <hr />
        <p>一般社団法人 日本クラリネット協会事務局</p>
      `;

      const officeSubject = `【申込】${YOUNG_2026.name} - ${name} 様`;
      const officeHtml = `
        <p>新しい申込がありました。</p>
        <pre style="white-space: pre-wrap; font-family: sans-serif; background: #f5f5f5; padding: 1em; border-radius: 4px;">${appText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
      `;

      try {
        await Promise.all([
          transporter.sendMail({
            from: `"日本クラリネット協会" <${emailUser}>`,
            to: email,
            subject: participantSubject,
            html: participantHtml,
          }),
          transporter.sendMail({
            from: `"日本クラリネット協会" <${emailUser}>`,
            to: OFFICE_EMAIL,
            subject: officeSubject,
            html: officeHtml,
          }),
        ]);
      } catch (emailErr) {
        console.error("メール送信エラー（申込はDBに保存済み）:", emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Apply API error:", err);
    return NextResponse.json(
      { error: "申込処理中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
