import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { ENSEMBLE_2027 } from "@/lib/ensemble-2027";
import { createEnsemble2027Application } from "@/lib/ensemble-2027-create-application";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!stripeSecret || !supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            "決済の準備ができていません（STRIPE_SECRET_KEY / Supabase URL / SUPABASE_SERVICE_ROLE_KEY を確認してください）。",
        },
        { status: 500 }
      );
    }

    const db = createClient(supabaseUrl, serviceRoleKey);

    const created = await createEnsemble2027Application(db, body, "stripe_card");
    if (!created.ok) {
      return NextResponse.json(
        { error: created.message },
        { status: created.status ?? 400 }
      );
    }

    const { parsed } = created;
    const stripe = new Stripe(stripeSecret);
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? request.headers.get("origin") ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: `${ENSEMBLE_2027.name} 動画審査料`,
              description: `${parsed.category}（${parsed.member_type}）`,
            },
            unit_amount: created.amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        application_id: created.applicationId,
        competition_slug: ENSEMBLE_2027.slug,
        member_type: parsed.member_type,
      },
      success_url: `${baseUrl}/events/ensemble/apply/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/events/ensemble/apply`,
      customer_email: parsed.email,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Ensemble checkout API error:", err);
    return NextResponse.json(
      { error: "決済の準備中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
