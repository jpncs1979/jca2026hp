import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getAnnualMembershipFeeYen } from "@/lib/membership-fees";
import {
  isPaidForMembershipFiscalYear,
  type PaymentRowForFee,
} from "@/lib/membership-fee-status";
import {
  MEMBERSHIP_AUTO_CHARGE_DAY_OF_MONTH_JST,
  targetFiscalYearJanuaryCardCharge,
} from "@/lib/membership-january-charge";
import { membershipEligibilityEndIsoFromMaxPaidBusinessFiscalYear } from "@/lib/membership-fiscal-year";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const header = request.headers.get("x-cron-secret");
  return header === secret;
}

function nowInJst(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
}

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

/**
 * クレジットカード会員の翌事業年度会費を Stripe で自動徴収（毎年 JST 1/22 想定）。
 * CSS（銀行振込）会員は対象外。事前に入会・マイページ決済で保存した Customer の default PM を使用。
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jst = nowInJst();
  if (jst.getMonth() !== 0) {
    return NextResponse.json({
      skipped: true,
      reason: "JST で 1 月のみ実行されます",
      jstMonth: jst.getMonth() + 1,
    });
  }
  if (jst.getDate() !== MEMBERSHIP_AUTO_CHARGE_DAY_OF_MONTH_JST) {
    return NextResponse.json({
      skipped: true,
      reason: `JST の実行日は ${MEMBERSHIP_AUTO_CHARGE_DAY_OF_MONTH_JST} 日のみです`,
      jstDay: jst.getDate(),
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server config error" }, { status: 500 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const targetFy = targetFiscalYearJanuaryCardCharge(jst);

  const { data: profiles, error: fetchErr } = await supabase
    .from("profiles")
    .select("id, membership_type, status, is_css_user, stripe_customer_id")
    .eq("status", "active")
    .not("stripe_customer_id", "is", null);

  if (fetchErr) {
    console.error("membership-january-charge fetch:", fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  const cardTargets = (profiles ?? []).filter(
    (p) =>
      typeof p.stripe_customer_id === "string" &&
      p.stripe_customer_id.trim() !== "" &&
      p.is_css_user !== true
  );

  if (cardTargets.length === 0) {
    return NextResponse.json({
      ok: true,
      targetFiscalYear: targetFy,
      charged: 0,
      skipped: 0,
      message: "対象会員がありません",
    });
  }

  const profileIds = cardTargets.map((p) => p.id);
  const { data: payRows } = await supabase
    .from("payments")
    .select("profile_id, purpose, method, metadata, created_at, membership_fiscal_year")
    .eq("purpose", "membership_fee")
    .in("profile_id", profileIds);

  const paymentsByProfile = new Map<string, PaymentRowForFee[]>();
  for (const row of payRows ?? []) {
    const pid = row.profile_id as string;
    const list = paymentsByProfile.get(pid) ?? [];
    list.push(row as PaymentRowForFee);
    paymentsByProfile.set(pid, list);
  }

  const { data: memRows } = await supabase
    .from("memberships")
    .select("profile_id, expiry_date")
    .in("profile_id", profileIds)
    .order("expiry_date", { ascending: false });

  const expiryByProfile = new Map<string, string | null>();
  for (const row of memRows ?? []) {
    if (!expiryByProfile.has(row.profile_id as string)) {
      expiryByProfile.set(row.profile_id as string, (row.expiry_date as string) ?? null);
    }
  }

  let charged = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const p of cardTargets) {
    const pid = p.id;
    const payments = paymentsByProfile.get(pid) ?? [];
    const latestExp = expiryByProfile.get(pid) ?? null;

    if (isPaidForMembershipFiscalYear(payments, latestExp, targetFy)) {
      skipped += 1;
      continue;
    }

    const alreadyAuto = payments.some((row) => {
      const m = row.metadata as Record<string, unknown> | undefined;
      return m?.january_auto === "1" && String(m.fiscal_year) === String(targetFy);
    });
    if (alreadyAuto) {
      skipped += 1;
      continue;
    }

    const amount = getAnnualMembershipFeeYen(p.membership_type);
    const customerId = String(p.stripe_customer_id).trim();

    let defaultPm: string | null = null;
    try {
      const customer = await stripe.customers.retrieve(customerId, {
        expand: ["invoice_settings.default_payment_method"],
      });
      if (customer.deleted) {
        errors.push(`${pid}: customer deleted`);
        skipped += 1;
        continue;
      }
      const inv = customer.invoice_settings?.default_payment_method;
      if (typeof inv === "string") defaultPm = inv;
      else if (inv && typeof inv === "object" && "id" in inv) {
        defaultPm = (inv as Stripe.PaymentMethod).id;
      }
    } catch (e) {
      errors.push(`${pid}: retrieve customer ${e instanceof Error ? e.message : String(e)}`);
      skipped += 1;
      continue;
    }

    if (!defaultPm) {
      errors.push(`${pid}: no default payment method`);
      skipped += 1;
      continue;
    }

    try {
      const pi = await stripe.paymentIntents.create(
        {
          amount,
          currency: "jpy",
          customer: customerId,
          payment_method: defaultPm,
          off_session: true,
          confirm: true,
          description: `日本クラリネット協会 年会費（${targetFy}年度・1月自動引き落とし）`,
          metadata: {
            type: "membership_january_auto",
            profile_id: pid,
            fiscal_year: String(targetFy),
          },
        },
        { idempotencyKey: `jan-auto-${pid}-${targetFy}` }
      );

      if (pi.status !== "succeeded") {
        errors.push(`${pid}: PI status ${pi.status}`);
        skipped += 1;
        continue;
      }

      const { data: existingByPi } = await supabase
        .from("payments")
        .select("id")
        .eq("transaction_id", pi.id)
        .maybeSingle();
      if (existingByPi) {
        skipped += 1;
        continue;
      }

      const payInsertBase = {
        profile_id: pid,
        amount,
        purpose: "membership_fee" as const,
        method: "stripe" as const,
        transaction_id: pi.id,
        metadata: {
          fiscal_year: String(targetFy),
          january_auto: "1",
          payment_intent_id: pi.id,
        },
      };

      let insErr = (
        await supabase
          .from("payments")
          .insert({ ...payInsertBase, membership_fiscal_year: targetFy })
      ).error;
      if (
        insErr &&
        (insErr.message?.includes("membership_fiscal_year") || insErr.message?.includes("column"))
      ) {
        insErr = (await supabase.from("payments").insert(payInsertBase)).error;
      }
      if (insErr) {
        errors.push(`${pid}: DB insert after charge ${insErr.message}`);
        continue;
      }

      const paidEnd = membershipEligibilityEndIsoFromMaxPaidBusinessFiscalYear(targetFy);
      const newExp = latestExp && latestExp > paidEnd ? latestExp : paidEnd;

      const { data: latestMem } = await supabase
        .from("memberships")
        .select("id")
        .eq("profile_id", pid)
        .order("expiry_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestMem?.id) {
        await supabase
          .from("memberships")
          .update({
            expiry_date: newExp,
            payment_method: "stripe",
            updated_at: new Date().toISOString(),
          })
          .eq("id", latestMem.id);
      }

      await supabase
        .from("profiles")
        .update({ status: "active", updated_at: new Date().toISOString() })
        .eq("id", pid);

      charged += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${pid}: charge ${msg}`);
      skipped += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    targetFiscalYear: targetFy,
    charged,
    skipped,
    errors: errors.length ? errors : undefined,
  });
}
