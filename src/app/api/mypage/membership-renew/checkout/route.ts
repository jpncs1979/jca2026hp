import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAnnualMembershipFeeYen } from "@/lib/membership-fees";
import { normalizeBaseUrl } from "@/lib/utils";
import {
  buildMembershipFeeYearRows,
  type PaymentRowForFee,
} from "@/lib/membership-fee-status";
import { recentFiscalYears } from "@/lib/membership-fiscal-year";

const METADATA_TYPE = "membership_renewal";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

/**
 * ログイン会員の年会費を Stripe Checkout で支払う（マイページ）。
 * body: { fiscal_year?: number } 省略時は直近3年度のうち最初の未納年度。
 */
export async function POST(request: Request) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    if (!stripeSecret) {
      return NextResponse.json({ error: "決済の設定が完了していません。" }, { status: 500 });
    }

    let body: { fiscal_year?: number } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const admin = createAdminClient();
    const selectProfile =
      "id, user_id, email, name, membership_type, status, is_css_user, stripe_customer_id";

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

    if (profile.is_css_user === true) {
      return NextResponse.json(
        {
          error:
            "口座振替（CSS）対象のため、クレジット決済に切り替えてからお手続きください。",
        },
        { status: 400 }
      );
    }

    const { data: memList } = await admin
      .from("memberships")
      .select("expiry_date")
      .eq("profile_id", profile.id)
      .order("expiry_date", { ascending: false })
      .limit(1);
    const latestExpiry = memList?.[0]?.expiry_date ?? null;

    const { data: payRows } = await admin
      .from("payments")
      .select("purpose, method, metadata, created_at")
      .eq("profile_id", profile.id)
      .eq("purpose", "membership_fee");

    const payments = (payRows ?? []) as PaymentRowForFee[];
    const rows = buildMembershipFeeYearRows(payments, latestExpiry, 3);
    let fiscalYear = typeof body.fiscal_year === "number" ? body.fiscal_year : NaN;
    if (!Number.isFinite(fiscalYear)) {
      const unpaidRows = rows.filter((r) => r.status === "未払い");
      if (unpaidRows.length === 0) {
        return NextResponse.json(
          { error: "未納の年度が見つかりません（既にお支払い済みの可能性があります）。" },
          { status: 400 }
        );
      }
      fiscalYear = Math.min(...unpaidRows.map((r) => r.fiscal_year));
    }

    const allowed = recentFiscalYears(3);
    if (!allowed.includes(fiscalYear)) {
      return NextResponse.json(
        { error: "指定できるのは直近3年度分のみです。" },
        { status: 400 }
      );
    }

    const targetRow = rows.find((r) => r.fiscal_year === fiscalYear);
    if (targetRow && targetRow.status !== "未払い") {
      return NextResponse.json(
        { error: `${fiscalYear}年度分は既に支払い済みです。` },
        { status: 400 }
      );
    }

    const amount = getAnnualMembershipFeeYen(profile.membership_type);
    const stripe = new Stripe(stripeSecret);
    const rawBase =
      process.env.NEXT_PUBLIC_SITE_URL ??
      request.headers.get("origin") ??
      "http://localhost:3000";
    const baseUrl = normalizeBaseUrl(rawBase);

    const stripeCustomerId =
      typeof profile.stripe_customer_id === "string" && profile.stripe_customer_id.trim()
        ? profile.stripe_customer_id.trim()
        : null;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      payment_intent_data: {
        setup_future_usage: "off_session",
      },
      ...(stripeCustomerId
        ? { customer: stripeCustomerId }
        : {
            customer_creation: "always",
            customer_email: profile.email ?? user.email ?? undefined,
          }),
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: `日本クラリネット協会 年会費（${fiscalYear}年度分）`,
              description: "会員マイページからのお支払い",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: METADATA_TYPE,
        profile_id: profile.id,
        fiscal_year: String(fiscalYear),
      },
      success_url: `${baseUrl}/mypage?fee_paid=1`,
      cancel_url: `${baseUrl}/mypage`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("membership-renew checkout:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "決済セッションの作成に失敗しました" },
      { status: 500 }
    );
  }
}
