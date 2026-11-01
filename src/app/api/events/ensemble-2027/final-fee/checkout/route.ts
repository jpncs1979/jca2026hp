import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { ENSEMBLE_2027 } from "@/lib/ensemble-2027";
import {
  ENSEMBLE_2027_FINAL_FEE_PATH,
  ENSEMBLE_2027_FINAL_MAX_PERFORMERS,
  ENSEMBLE_2027_FINAL_MIN_PERFORMERS,
  parsePerformerCount,
} from "@/lib/ensemble-2027-final-fee";
import {
  loadEnsemble2027FinalFeeApplication,
  recordEnsemble2027FinalFee,
  sendEnsemble2027FinalFeeEmail,
} from "@/lib/ensemble-2027-final-fee-server";

/** 本選参加料：演奏者数を受け取り、カード決済画面へ（0円の団体はその場で参加確定） */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id : "";
    const token = typeof body.t === "string" ? body.t : "";
    const performerCount = parsePerformerCount(body.performer_count);
    if (performerCount == null) {
      return NextResponse.json(
        {
          error: `本選の演奏者数を${ENSEMBLE_2027_FINAL_MIN_PERFORMERS}〜${ENSEMBLE_2027_FINAL_MAX_PERFORMERS}の数字で入力してください。`,
        },
        { status: 400 }
      );
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!stripeSecret || !supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "決済の準備ができていません。" }, { status: 500 });
    }

    const db = createClient(supabaseUrl, serviceRoleKey);
    const loaded = await loadEnsemble2027FinalFeeApplication(db, id, token);
    if (!loaded.ok) {
      return NextResponse.json({ error: loaded.message }, { status: loaded.status });
    }
    const { app, unitFee } = loaded;
    if (app.final_fee_status) {
      return NextResponse.json({ error: "本選参加料の手続きは既に完了しています。" }, { status: 400 });
    }

    const amount = unitFee * performerCount;
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? request.headers.get("origin") ?? "http://localhost:3000";
    const pageUrl = `${baseUrl}${ENSEMBLE_2027_FINAL_FEE_PATH}?id=${encodeURIComponent(id)}&t=${encodeURIComponent(token)}`;

    // 会員の小・中学生／高校生部門は0円：決済なしで参加確定
    if (amount === 0) {
      const rec = await recordEnsemble2027FinalFee(db, id, {
        status: "free",
        amount: 0,
        performerCount,
      });
      if (rec.error) {
        return NextResponse.json({ error: "保存に失敗しました。事務局までお問い合わせください。" }, { status: 500 });
      }
      if (rec.updated) {
        try {
          await sendEnsemble2027FinalFeeEmail({ app, status: "free", amount: 0, performerCount, unitFee });
        } catch (err) {
          console.error("[アンコン本選参加料] 0円確定メール送信失敗", err);
        }
      }
      return NextResponse.json({ url: `${pageUrl}&done=1` });
    }

    const stripe = new Stripe(stripeSecret);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: `${ENSEMBLE_2027.name} 本選参加料`,
              description: `${app.name}／${app.category}（${app.member_type}）`,
            },
            unit_amount: unitFee,
          },
          quantity: performerCount,
        },
      ],
      metadata: {
        type: "ensemble_final_fee",
        application_id: id,
        competition_slug: ENSEMBLE_2027.slug,
        performer_count: String(performerCount),
      },
      success_url: `${pageUrl}&done=1`,
      cancel_url: pageUrl,
      customer_email: app.email ?? undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Ensemble final fee checkout error:", err);
    return NextResponse.json({ error: "決済の準備中にエラーが発生しました。" }, { status: 500 });
  }
}
