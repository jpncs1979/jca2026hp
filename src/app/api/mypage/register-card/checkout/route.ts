import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { normalizeBaseUrl } from "@/lib/utils";

const METADATA_TYPE = "mypage_card_setup";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

/**
 * 年会費の自動決済用に Stripe へクレジットカードのみ登録（決済は発生しない Setup モード）。
 */
export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "決済の設定が完了していません。" }, { status: 500 });
    }

    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const admin = createAdminClient();
    const selectProfile =
      "id, user_id, email, name, status, is_css_user, stripe_customer_id";

    let { data: profile } = await admin
      .from("profiles")
      .select(selectProfile)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile && user.email) {
      const { data: byEmail } = await admin
        .from("profiles")
        .select(selectProfile)
        .is("user_id", null)
        .ilike("email", user.email.trim())
        .maybeSingle();
      profile = byEmail;
    }

    if (!profile) {
      return NextResponse.json({ error: "会員情報が見つかりません。" }, { status: 404 });
    }

    if (profile.status === "pending") {
      return NextResponse.json(
        { error: "承認待ちのため、こちらからはカード登録できません。" },
        { status: 400 }
      );
    }

    if (profile.is_css_user === true) {
      return NextResponse.json(
        {
          error:
            "口座振替（CSS）対象のため、先にマイページの「クレジットカード支払いに切り替える」から切り替えてください。",
        },
        { status: 400 }
      );
    }

    const existingCustomer =
      typeof profile.stripe_customer_id === "string" && profile.stripe_customer_id.trim();
    if (existingCustomer) {
      return NextResponse.json(
        { error: "既に Stripe にカードが登録されています。" },
        { status: 400 }
      );
    }

    const rawBase =
      process.env.NEXT_PUBLIC_SITE_URL ??
      request.headers.get("origin") ??
      "http://localhost:3000";
    const baseUrl = normalizeBaseUrl(rawBase);

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "setup",
      currency: "jpy",
      payment_method_types: ["card"],
      customer_creation: "always",
      customer_email: profile.email ?? user.email ?? undefined,
      metadata: {
        type: METADATA_TYPE,
        profile_id: profile.id,
      },
      success_url: `${baseUrl}/mypage?card_registered=1`,
      cancel_url: `${baseUrl}/mypage`,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("register-card checkout:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "決済セッションの作成に失敗しました" },
      { status: 500 }
    );
  }
}
