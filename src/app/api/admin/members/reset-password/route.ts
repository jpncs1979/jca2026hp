import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { OFFICE_FROM_HEADER } from "@/lib/email";
import nodemailer from "nodemailer";

/** 事務局が会員に「パスワード再設定メール」を送信。本人がメールのリンクから新しいパスワードを設定する */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "未認証" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: adminProfile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!adminProfile?.is_admin) {
      return NextResponse.json(
        {
          error:
            "権限がありません。事務局用アカウントでログインし直すか、Supabase の profiles テーブルでご自身の is_admin が true か確認してください。",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { profile_id } = body as { profile_id?: string };

    if (!profile_id) {
      return NextResponse.json(
        { error: "profile_id を指定してください。" },
        { status: 400 }
      );
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("user_id, name, email")
      .eq("id", profile_id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "会員が見つかりません" }, { status: 404 });
    }

    if (!profile.user_id) {
      return NextResponse.json(
        { error: "この会員にはログイン用アカウントが紐付いていません。会員にサイトから新規登録してもらうか、Supabase の Authentication で同じメールアドレスのユーザーを作成してください。" },
        { status: 400 }
      );
    }

    const email = String(profile.email ?? "").trim();
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "この会員にメールアドレスが登録されていません。" },
        { status: 400 }
      );
    }

    // メールリンククリック後は /auth/callback → パスワード再設定専用ページへ
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      "http://localhost:3000";
    const redirectTo = `${siteUrl}/auth/callback?next=/auth/set-password`;

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo, redirect_to: redirectTo },
    });

    if (linkError) {
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    const props = (linkData as { properties?: { action_link?: string } })?.properties;
    let actionLink =
      props?.action_link
      ?? (linkData as { action_link?: string })?.action_link;

    if (!actionLink) {
      return NextResponse.json(
        { error: "再設定リンクの生成に失敗しました。" },
        { status: 500 }
      );
    }

    // Supabase が redirect_to を付けない場合に備え、メールのリンクに明示的に付与する
    try {
      const url = new URL(actionLink);
      if (!url.searchParams.has("redirect_to")) {
        url.searchParams.set("redirect_to", redirectTo);
        actionLink = url.toString();
      }
    } catch {
      // URL パース失敗時はそのまま使用
    }

    const emailUser = process.env.EMAIL_USER;
    const emailAppPassword = process.env.EMAIL_APP_PASSWORD;
    if (!emailUser || !emailAppPassword) {
      return NextResponse.json(
        { error: "メール送信の設定がありません。EMAIL_USER と EMAIL_APP_PASSWORD を設定してください。" },
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

    const html = `
      <p>日本クラリネット協会の会員マイページで、パスワード再設定のリクエストがありました。</p>
      <p>新しいパスワードを設定するには、以下のリンクをクリックしてください。</p>
      <p><a href="${actionLink}" style="color: #b8860b; text-decoration: underline;">パスワードを再設定する</a></p>
      <p>※このメールに心当たりがない場合は、破棄してください。</p>
      <p>※リンクの有効期限は限られています。お早めに手続きをお願いします。</p>
      <hr>
      <p style="color: #666; font-size: 12px;">一般社団法人 日本クラリネット協会</p>
    `;

    await transporter.sendMail({
      from: OFFICE_FROM_HEADER,
      to: email,
      subject: "【日本クラリネット協会】パスワードの再設定",
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reset password email error:", err);
    return NextResponse.json(
      { error: "パスワード再設定メールの送信に失敗しました" },
      { status: 500 }
    );
  }
}
