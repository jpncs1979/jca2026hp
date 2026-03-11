import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getFromHeader } from "@/lib/email";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "未認証" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { profile_id } = await request.json();
    if (!profile_id) {
      return NextResponse.json({ error: "profile_id が必要です" }, { status: 400 });
    }

    const { data: target, error: fetchError } = await admin
      .from("profiles")
      .select("id, name, email, status")
      .eq("id", profile_id)
      .single();

    if (fetchError || !target) {
      return NextResponse.json({ error: "会員が見つかりません" }, { status: 404 });
    }

    if (target.status !== "pending") {
      return NextResponse.json({ error: "承認済みまたは対象外です" }, { status: 400 });
    }

    const { error: updateError } = await admin
      .from("profiles")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", profile_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 入会承認メール送信
    const emailUser = process.env.EMAIL_USER;
    const emailAppPassword = process.env.EMAIL_APP_PASSWORD;
    if (emailUser && emailAppPassword && target.email) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: emailUser,
          pass: emailAppPassword.replace(/\s/g, ""),
        },
      });
      try {
        await transporter.sendMail({
          from: getFromHeader(),
          to: target.email,
          subject: "【日本クラリネット協会】入会のご承認について",
          html: `
            <p>${target.name} 様</p>
            <p>この度は日本クラリネット協会へのご入会をお申し込みいただき、ありがとうございます。</p>
            <p>入会の審査が完了し、<strong>正式に会員として承認</strong>されました。</p>
            <p>会員マイページより、会員証のご確認や各種サービスをご利用いただけます。</p>
            <p>ご不明な点がございましたら、事務局までお問い合わせください。</p>
            <hr />
            <p>一般社団法人 日本クラリネット協会事務局</p>
          `,
        });
      } catch (emailErr) {
        const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
        console.error("入会承認メール送信エラー:", msg, emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Approve error:", err);
    return NextResponse.json(
      { error: "処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
