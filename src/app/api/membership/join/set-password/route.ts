import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const METADATA_TYPE_MEMBERSHIP_JOIN = "membership_join";

export async function POST(request: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!stripeSecret || !supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "設定が完了していません。" },
      { status: 500 }
    );
  }

  let body: { session_id?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "リクエスト形式が不正です。" },
      { status: 400 }
    );
  }

  const sessionId =
    typeof body.session_id === "string" ? body.session_id.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!sessionId) {
    return NextResponse.json(
      { error: "セッション情報がありません。入会完了ページから再度お試しください。" },
      { status: 400 }
    );
  }

  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "パスワードは6文字以上で入力してください。" },
      { status: 400 }
    );
  }

  const stripe = new Stripe(stripeSecret);
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json(
      { error: "決済情報を確認できませんでした。URLをご確認ください。" },
      { status: 400 }
    );
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json(
      { error: "決済が完了していません。" },
      { status: 400 }
    );
  }

  const meta = session.metadata;
  if (
    !meta ||
    meta.type !== METADATA_TYPE_MEMBERSHIP_JOIN ||
    !meta.email
  ) {
    return NextResponse.json(
      { error: "入会決済のセッションではありません。" },
      { status: 400 }
    );
  }

  const email = String(meta.email).trim();
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, user_id")
    .eq("email", email)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "会員情報が見つかりません。決済完了後しばらくお待ちいただくか、事務局へお問い合わせください。" },
      { status: 404 }
    );
  }

  if (profile.user_id) {
    return NextResponse.json(
      { error: "既にパスワードが設定されています。ログインしてください。" },
      { status: 400 }
    );
  }

  const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createUserError || !newUser.user) {
    const msg = createUserError?.message ?? "アカウントの作成に失敗しました。";
    if (msg.includes("already been registered") || msg.includes("already exists")) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています。ログインしてください。" },
        { status: 400 }
      );
    }
    console.error("[set-password] createUser error:", createUserError);
    return NextResponse.json(
      { error: "パスワードの設定に失敗しました。しばらくしてからお試しください。" },
      { status: 500 }
    );
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      user_id: newUser.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  if (updateError) {
    console.error("[set-password] profile update error:", updateError);
    return NextResponse.json(
      { error: "会員情報の紐付けに失敗しました。お手数ですがお問い合わせください。" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
