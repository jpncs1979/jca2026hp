import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { getFromHeader } from "@/lib/email";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const header = request.headers.get("x-cron-secret");
  return header === secret;
}

/**
 * 26歳ルール予告: 来年度に26歳になる学生会員（現在25歳）に、
 * 「来年度から正会員になります」メールを送信する。12月実行想定。
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Server config error" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const nextYear = new Date().getFullYear() + 1;
  const birthYearTarget = nextYear - 26; // 来年26歳 = 今年25歳

  const { data: profiles, error: fetchError } = await supabase
    .from("profiles")
    .select("id, name, email, birth_date")
    .eq("membership_type", "student")
    .not("birth_date", "is", null);

  if (fetchError) {
    console.error("student-upgrade-preview fetch error:", fetchError);
    return NextResponse.json(
      { error: fetchError.message },
      { status: 500 }
    );
  }

  const recipients = (profiles ?? []).filter((p) => {
    if (!p.birth_date) return false;
    const birthYear = new Date(p.birth_date).getFullYear();
    return birthYear === birthYearTarget;
  });

  if (recipients.length === 0) {
    return NextResponse.json({
      ok: true,
      message: "予告メール送信対象者なし",
      sent: 0,
    });
  }

  const emailUser = process.env.EMAIL_USER;
  const emailAppPassword = process.env.EMAIL_APP_PASSWORD;
  if (!emailUser || !emailAppPassword) {
    return NextResponse.json(
      { error: "メール設定がありません" },
      { status: 500 }
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailAppPassword.replace(/\s/g, ""),
    },
  });

  let sent = 0;
  for (const p of recipients) {
    if (!p.email) continue;
    try {
      await transporter.sendMail({
        from: getFromHeader(),
        to: p.email,
        subject: "【日本クラリネット協会】来年度の会員種別について（学生会員の皆様へ）",
        html: `
          <p>${p.name} 様</p>
          <p>日本クラリネット協会の学生会員の皆様には、26歳に達した年度より正会員に移行する規定がございます。</p>
          <p>お申し込み時の生年月日より、<strong>${nextYear}年度より正会員</strong>としてご継続いただくこととなります。<br />
          正会員の年会費は8,000円です。決済方法（口座振替・クレジットカード）は従来どおりです。</p>
          <p>ご不明な点がございましたら、事務局までお問い合わせください。</p>
          <hr />
          <p>一般社団法人 日本クラリネット協会事務局</p>
        `,
      });
      sent++;
    } catch (err) {
      console.error(`Preview email failed for ${p.email}:`, err);
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    total_recipients: recipients.length,
  });
}
