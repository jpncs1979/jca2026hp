import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getFromHeader } from "@/lib/email";
import nodemailer from "nodemailer";

/**
 * 管理者のみ。メール設定の確認とテスト送信を行う。
 * GET /api/admin/email-test で呼ぶ（管理者ログイン済みであること）。
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
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

    const emailUser = process.env.EMAIL_USER;
    const emailAppPassword = process.env.EMAIL_APP_PASSWORD;

    if (!emailUser || !emailAppPassword) {
      return NextResponse.json({
        ok: false,
        message: "EMAIL_USER または EMAIL_APP_PASSWORD が未設定です。Vercel の Environment Variables を確認してください。",
        env: {
          EMAIL_USER_SET: !!emailUser,
          EMAIL_APP_PASSWORD_SET: !!emailAppPassword,
        },
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailAppPassword.replace(/\s/g, ""),
      },
    });

    const to = user.email;
    const fromHeader = getFromHeader();

    await transporter.sendMail({
      from: fromHeader,
      to,
      subject: "【テスト】日本クラリネット協会 メール送信確認",
      html: `
        <p>これはメール送信のテストです。</p>
        <p>このメールが届いていれば、本番環境からの送信設定は正常です。</p>
        <p>入会完了メールが届かない場合は、Stripe の Webhook が正しく呼ばれているか（開発者 → Webhook → 該当エンドポイントの「最近のイベント」）を確認してください。</p>
        <hr />
        <p>一般社団法人 日本クラリネット協会</p>
      `,
    });

    return NextResponse.json({
      ok: true,
      message: `テストメールを ${to} に送信しました。受信トレイ（迷惑メールフォルダも）をご確認ください。`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[email-test]", msg, err);
    return NextResponse.json({
      ok: false,
      message: "送信に失敗しました。",
      error: msg,
    });
  }
}
