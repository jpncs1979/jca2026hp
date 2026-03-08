import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Webhook signature or secret missing" }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const applicationId = session.metadata?.application_id;
    const memberType = session.metadata?.member_type;
    const isSimultaneousJoin = memberType === "同時入会";

    if (!applicationId) {
      console.error("No application_id in session metadata");
      return NextResponse.json({ error: "Missing application_id" }, { status: 400 });
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server config error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: app, error: appError } = await supabase
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (appError || !app) {
      console.error("Application not found:", applicationId, appError);
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("applications")
      .update({
        payment_status: "paid",
        payment_date: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (updateError) {
      console.error("Failed to update application:", updateError);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    if (isSimultaneousJoin) {
      const joinDate = new Date();
      const expiryDate = new Date(joinDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      const { data: newProfile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          name: app.name,
          name_kana: app.furigana,
          email: app.email,
          status: "pending",
          category: "general",
          membership_type: "regular",
        })
        .select("id")
        .single();

      if (profileError || !newProfile) {
        console.error("Failed to create profile for 同時入会:", profileError);
      } else {
        await supabase.from("memberships").insert({
          profile_id: newProfile.id,
          join_date: joinDate.toISOString().slice(0, 10),
          expiry_date: expiryDate.toISOString().slice(0, 10),
          payment_method: "stripe",
        });

        await supabase
          .from("applications")
          .update({ profile_id: newProfile.id })
          .eq("id", applicationId);
      }
    }

    const { data: comp } = await supabase
      .from("competitions")
      .select("id")
      .eq("id", app.competition_id)
      .single();

    if (comp) {
      const profileId = isSimultaneousJoin ? (await supabase.from("applications").select("profile_id").eq("id", applicationId).single()).data?.profile_id : app.profile_id;
      if (profileId) {
        await supabase.from("payments").insert({
          profile_id: profileId,
          amount: app.amount ?? 0,
          purpose: "competition_fee",
          method: "stripe",
          transaction_id: session.payment_intent as string,
          metadata: { application_id: applicationId },
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
