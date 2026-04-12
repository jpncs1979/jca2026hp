import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { YOUNG_2026 } from "@/lib/young-2026";
import { createYoung2026Application } from "@/lib/young-2026-create-application";

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

    const created = await createYoung2026Application(db, body, "stripe_card");
    if (!created.ok) {
      return NextResponse.json(
        { error: created.message },
        { status: created.status ?? 400 }
      );
    }

    const { parsed } = created;
    const category = parsed.category;
    const memberType = parsed.member_type;

    const stripe = new Stripe(stripeSecret);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.headers.get("origin") ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: `${YOUNG_2026.name} 参加費`,
              description: `${category}部門${memberType === "同時入会" ? "（同時入会含む）" : ""}`,
            },
            unit_amount: created.amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        application_id: created.applicationId,
        competition_slug: YOUNG_2026.slug,
        member_type: memberType,
      },
      success_url: `${baseUrl}/events/young-2026/apply/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/events/young-2026/apply`,
      customer_email: parsed.email,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout API error:", err);
    return NextResponse.json(
      { error: "決済の準備中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
