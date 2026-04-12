import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { getCompetitionFromHeader, getFromHeader, OFFICE_FROM_EMAIL } from "@/lib/email";
import { joinMembershipFeeFiscalYears } from "@/lib/membership-fees";
import { membershipEligibilityEndIsoFromMaxPaidBusinessFiscalYear } from "@/lib/membership-fiscal-year";
import {
  syncStripeCustomerDefaultPaymentMethod,
  syncStripeCustomerFromSetupCheckoutSession,
} from "@/lib/stripe-customer-sync";
import {
  applicationRowToMailFields,
  buildYoung2026ApplicationDetailsSection,
} from "@/lib/young-2026-application-mail-html";
import { YOUNG_2026 } from "@/lib/young-2026";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** コンクール申込（Stripe）決済完了時に申込者へ送る確認メール */
async function sendCompetitionApplicationPaidEmail(
  app: Record<string, unknown>,
  opts: {
    competitionSlug: string;
    /** 同時入会でない / 会員登録まで完了 / 会員登録に失敗のいずれか */
    simultaneousJoinState: "none" | "registered" | "failed";
  }
): Promise<void> {
  const emailRaw = typeof app.email === "string" ? app.email.trim() : "";
  if (!emailRaw) return;

  const slug = opts.competitionSlug.trim() || YOUNG_2026.slug;
  const compTitle = slug === YOUNG_2026.slug ? YOUNG_2026.name : `コンクール（${slug}）`;
  const compNameHtml =
    slug === YOUNG_2026.slug ? escapeHtml(YOUNG_2026.name) : `コンクール（${escapeHtml(slug)}）`;

  const name = escapeHtml(String(app.name ?? ""));
  const mailFields = applicationRowToMailFields(app);
  const appId = typeof app.id === "string" ? app.id : "";
  const amountYen =
    typeof app.amount === "number" && Number.isFinite(app.amount) ? app.amount : null;
  const detailsHtml = buildYoung2026ApplicationDetailsSection(mailFields, {
    applicationId: appId || undefined,
    amountYen,
    paymentRouteLabel: "クレジットカード（Stripe）",
  });

  const lines: string[] = [
    `<p>${name} 様</p>`,
    `<p>この度は${compNameHtml}にお申し込みいただき、ありがとうございます。</p>`,
    `<p>クレジットカードでのお支払いを確認し、<strong>お申し込みの登録が完了</strong>いたしました。</p>`,
    opts.simultaneousJoinState === "registered"
      ? `<p>併せて、<strong>協会への同時入会</strong>の手続きが完了し、会員データベースに登録されました。</p>`
      : opts.simultaneousJoinState === "failed"
        ? `<p>同時入会をお申し込みいただいております。会員データベースへの反映で不備が生じた可能性があります。事務局までご連絡ください。</p>`
        : "",
    detailsHtml,
    `<p>ご不明な点がございましたら、事務局までお問い合わせください。</p>`,
    `<hr />`,
    `<p>一般社団法人 日本クラリネット協会事務局</p>`,
  ];

  const emailUser = process.env.EMAIL_USER;
  const emailAppPassword = process.env.EMAIL_APP_PASSWORD;
  if (!emailUser || !emailAppPassword) {
    console.warn(
      "[コンクール申込メール] EMAIL_USER / EMAIL_APP_PASSWORD 未設定のため送信しません（Vercel の環境変数を確認してください）"
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailAppPassword.replace(/\s/g, ""),
    },
  });

  const fromHeader = getCompetitionFromHeader();
  const applicantHtml = lines.filter(Boolean).join("\n");

  try {
    await transporter.sendMail({
      from: fromHeader,
      to: emailRaw,
      replyTo: OFFICE_FROM_EMAIL,
      subject: `【${compTitle}】お申し込み・お支払いが完了しました`,
      html: applicantHtml,
    });
    console.log("[コンクール申込メール] 本人宛送信完了", emailRaw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[コンクール申込メール] 本人宛送信失敗:", msg, err);
    throw err;
  }

  const officeNotifyEmail = (process.env.OFFICE_NOTIFY_EMAIL ?? emailUser).trim();
  const officeDetailsHtml = buildYoung2026ApplicationDetailsSection(mailFields, {
    applicationId: appId || undefined,
    amountYen,
    paymentRouteLabel: "クレジットカード（Stripe）",
  });

  if (officeNotifyEmail) {
    try {
      await transporter.sendMail({
        from: fromHeader,
        to: officeNotifyEmail,
        replyTo: OFFICE_FROM_EMAIL,
        subject: `【事務局】${compTitle} 申込・決済完了`,
        html: `
          <p>ウェブ経由でコンクールの申込と決済が完了しました。</p>
          ${officeDetailsHtml}
          <p><strong>同時入会の状態：</strong>${
            opts.simultaneousJoinState === "registered"
              ? "会員登録まで完了"
              : opts.simultaneousJoinState === "failed"
                ? "会員登録に失敗の可能性あり（要確認）"
                : "なし／非対象"
          }</p>
          <p>管理画面のコンクール申込一覧でご確認ください。</p>
          <hr />
          <p>一般社団法人 日本クラリネット協会</p>
        `,
      });
      console.log("[コンクール申込メール] 事務局宛送信完了", officeNotifyEmail);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[コンクール申込メール] 事務局宛送信失敗:", msg, err);
    }
  }
}

/** 入会決済完了時: プロフィール・会員契約・入金記録を作成し、入会完了メールを送信 */
async function handleMembershipJoinCompleted(
  session: Stripe.Checkout.Session
): Promise<{ ok: boolean }> {
  const meta = session.metadata;
  if (!meta || meta.type !== "membership_join" || !meta.email || !meta.name) {
    console.warn("[入会Webhook] スキップ: metadata不足", {
      hasMeta: !!meta,
      type: meta?.type,
      hasEmail: !!meta?.email,
      hasName: !!meta?.name,
    });
    return { ok: false };
  }
  console.log("[入会Webhook] 処理開始", { email: meta.email, name: meta.name });

  if (!supabaseUrl || !serviceRoleKey) return { ok: false };
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const joinDate = new Date();
  const feeFiscalYears = joinMembershipFeeFiscalYears(joinDate);
  const maxPaidFy = Math.max(...feeFiscalYears);
  const expiryStr = membershipEligibilityEndIsoFromMaxPaidBusinessFiscalYear(maxPaidFy);
  const fiscalYearsStr = feeFiscalYears.join(",");

  const { data: newProfile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      name: meta.name,
      name_kana: meta.name_kana ?? meta.name,
      email: meta.email,
      zip_code: meta.zip_code || null,
      address: meta.address || null,
      phone: meta.phone || null,
      affiliation: meta.affiliation || null,
      gender: meta.gender || null,
      birth_date: meta.birth_date || null,
      category: meta.affiliation === "student" ? "student" : meta.affiliation === "professional" ? "professional" : "general",
      membership_type: meta.membership_type === "student" ? "student" : "regular",
      status: "active",
      /** 入会フォームで ICA 希望の場合は ICA 会員として登録（ica_requested と同値） */
      ica_requested: meta.ica_requested === "1",
      is_ica_member: meta.ica_requested === "1",
      is_css_user: false,
    })
    .select("id")
    .single();

  if (profileError || !newProfile) {
    console.error("[入会Webhook] プロフィール作成失敗", profileError);
    return { ok: false };
  }
  console.log("[入会Webhook] プロフィール・会員契約・入金記録作成済み、メール送信へ");

  await supabase.from("memberships").insert({
    profile_id: newProfile.id,
    join_date: joinDate.toISOString().slice(0, 10),
    expiry_date: expiryStr,
    payment_method: "stripe",
  });

  const amount = session.amount_total ?? 0;
  const paymentBase = {
    profile_id: newProfile.id,
    amount,
    purpose: "membership_fee" as const,
    method: "stripe" as const,
    transaction_id: session.payment_intent as string,
    metadata: {
      checkout_session_id: session.id,
      fiscal_years: fiscalYearsStr,
    },
  };
  let payErr = (
    await supabase.from("payments").insert({ ...paymentBase, membership_fiscal_year: maxPaidFy })
  ).error;
  if (
    payErr &&
    (payErr.message?.includes("membership_fiscal_year") || payErr.message?.includes("column"))
  ) {
    payErr = (await supabase.from("payments").insert(paymentBase)).error;
  }
  if (payErr) {
    console.error("[入会Webhook] payments 挿入失敗", payErr);
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer &&
          typeof session.customer === "object" &&
          "id" in session.customer &&
          typeof (session.customer as { id?: string }).id === "string"
        ? (session.customer as { id: string }).id
        : null;
  if (customerId) {
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
      .eq("id", newProfile.id);
    const stripe = getStripe();
    if (stripe) {
      try {
        await syncStripeCustomerDefaultPaymentMethod(stripe, session);
      } catch (syncErr) {
        console.error("[入会Webhook] Stripe デフォルト支払方法の設定に失敗", syncErr);
      }
    }
  }

  const emailUser = process.env.EMAIL_USER;
  const emailAppPassword = process.env.EMAIL_APP_PASSWORD;
  const officeNotifyEmail = process.env.OFFICE_NOTIFY_EMAIL || emailUser;
  const fromHeader = getFromHeader();

  if (!emailUser || !emailAppPassword) {
    console.warn("[入会メール] EMAIL_USER または EMAIL_APP_PASSWORD が未設定のためメールを送信しません");
  } else {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailAppPassword.replace(/\s/g, ""),
      },
    });

    if (meta.email) {
      try {
        await transporter.sendMail({
          from: fromHeader,
          to: meta.email,
          subject: "【日本クラリネット協会】ご入会手続きが完了しました",
          html: `
          <p>${meta.name} 様</p>
          <p>この度は日本クラリネット協会へのご入会をいただき、ありがとうございます。</p>
          <p>お支払いが完了し、<strong>会員登録が完了</strong>いたしました。</p>
          <p>会員マイページより、会員証のご確認や各種サービスをご利用いただけます。<br />
          決済完了後、画面の案内に従ってマイページ用のパスワードを設定してください。設定後、このメールアドレスとパスワードでログインできます。</p>
          <p>ご不明な点がございましたら、事務局までお問い合わせください。</p>
          <hr />
          <p>一般社団法人 日本クラリネット協会事務局</p>
        `,
        });
        console.log("[入会Webhook] 本人宛メール送信完了", meta.email);
      } catch (emailErr) {
        const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
        const code = emailErr && typeof (emailErr as { code?: string }).code === "string" ? (emailErr as { code: string }).code : "";
        console.error("[入会完了メール送信エラー]", msg, code || "", emailErr);
      }
    }

    if (officeNotifyEmail) {
      try {
        const memberTypeLabel = meta.membership_type === "student" ? "学生会員" : "正会員";
        await transporter.sendMail({
          from: fromHeader,
          to: officeNotifyEmail,
          subject: "【事務局】新規入会の通知",
          html: `
          <p>ウェブ経由で新規入会がありました。</p>
          <ul>
            <li>氏名：${meta.name}（${meta.name_kana ?? ""}）</li>
            <li>メール：${meta.email}</li>
            <li>会員種別：${memberTypeLabel}</li>
            <li>入会日：${joinDate.toLocaleDateString("ja-JP")}</li>
            <li>ICA会員として登録：${meta.ica_requested === "1" ? "はい" : "いいえ"}</li>
          </ul>
          <p>管理画面の会員一覧でご確認ください。</p>
          <hr />
          <p>一般社団法人 日本クラリネット協会</p>
        `,
        });
        console.log("[入会Webhook] 事務局宛メール送信完了", officeNotifyEmail);
      } catch (emailErr) {
        const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
        console.error("[事務局通知メール送信エラー]", msg, emailErr);
      }
    }
  }

  return { ok: true };
}

/** マイページからの年会費決済完了 */
async function handleMembershipRenewalCompleted(
  session: Stripe.Checkout.Session,
  supabase: SupabaseClient
): Promise<{ ok: boolean }> {
  const meta = session.metadata;
  if (!meta || meta.type !== "membership_renewal" || !meta.profile_id || !meta.fiscal_year) {
    return { ok: false };
  }
  const fiscalYear = parseInt(String(meta.fiscal_year), 10);
  if (!Number.isFinite(fiscalYear)) return { ok: false };
  const profileId = String(meta.profile_id).trim();
  if (!profileId) return { ok: false };

  const sessionId = session.id;
  const { data: dup } = await supabase
    .from("payments")
    .select("id")
    .contains("metadata", { checkout_session_id: sessionId })
    .maybeSingle();
  if (dup) {
    return { ok: true };
  }

  const amount = session.amount_total ?? 0;
  const paymentRenewBase = {
    profile_id: profileId,
    amount,
    purpose: "membership_fee" as const,
    method: "stripe" as const,
    transaction_id: (session.payment_intent as string) ?? null,
    metadata: {
      checkout_session_id: sessionId,
      fiscal_year: String(fiscalYear),
    },
  };
  let payErr = (
    await supabase
      .from("payments")
      .insert({ ...paymentRenewBase, membership_fiscal_year: fiscalYear })
  ).error;
  if (
    payErr &&
    (payErr.message?.includes("membership_fiscal_year") || payErr.message?.includes("column"))
  ) {
    payErr = (await supabase.from("payments").insert(paymentRenewBase)).error;
  }
  if (payErr) {
    console.error("[年会費更新Webhook] payments 挿入失敗", payErr);
    return { ok: false };
  }

  const { data: latest } = await supabase
    .from("memberships")
    .select("id, expiry_date")
    .eq("profile_id", profileId)
    .order("expiry_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const paidMembershipEnd =
    membershipEligibilityEndIsoFromMaxPaidBusinessFiscalYear(fiscalYear);
  const newExp =
    latest?.expiry_date && latest.expiry_date > paidMembershipEnd
      ? latest.expiry_date
      : paidMembershipEnd;

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer &&
          typeof session.customer === "object" &&
          "id" in session.customer &&
          typeof (session.customer as { id?: string }).id === "string"
        ? (session.customer as { id: string }).id
        : null;
  if (customerId) {
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
      .eq("id", profileId);
    const stripeRenew = getStripe();
    if (stripeRenew) {
      try {
        await syncStripeCustomerDefaultPaymentMethod(stripeRenew, session);
      } catch (syncErr) {
        console.error("[年会費Webhook] Stripe デフォルト支払方法の設定に失敗", syncErr);
      }
    }
  }

  if (latest?.id) {
    const { error: upErr } = await supabase
      .from("memberships")
      .update({
        expiry_date: newExp,
        payment_method: "stripe",
        updated_at: new Date().toISOString(),
      })
      .eq("id", latest.id);
    if (upErr) {
      console.error("[年会費更新Webhook] memberships 更新失敗", upErr);
    }
  } else {
    const jd = new Date();
    jd.setFullYear(jd.getFullYear() - 1);
    await supabase.from("memberships").insert({
      profile_id: profileId,
      join_date: jd.toISOString().slice(0, 10),
      expiry_date: newExp,
      payment_method: "stripe",
    });
  }

  await supabase
    .from("profiles")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", profileId);

  return { ok: true };
}

/** マイページ「カードのみ登録」（決済なし・Setup モード）完了 */
async function handleMypageCardSetupCompleted(
  session: Stripe.Checkout.Session,
  supabase: SupabaseClient
): Promise<{ ok: boolean }> {
  const meta = session.metadata;
  if (!meta || meta.type !== "mypage_card_setup" || !meta.profile_id) {
    return { ok: false };
  }
  const profileId = String(meta.profile_id).trim();
  if (!profileId) return { ok: false };

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer &&
          typeof session.customer === "object" &&
          "id" in session.customer &&
          typeof (session.customer as { id?: string }).id === "string"
        ? (session.customer as { id: string }).id
        : null;
  if (!customerId) {
    console.warn("[カード登録Webhook] Customer ID なし", session.id);
    return { ok: false };
  }

  const stripe = getStripe();
  if (stripe) {
    try {
      await syncStripeCustomerFromSetupCheckoutSession(stripe, session);
    } catch (syncErr) {
      console.error("[カード登録Webhook] デフォルト支払方法の設定に失敗", syncErr);
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);
  if (error) {
    console.error("[カード登録Webhook] profiles 更新失敗", error);
    return { ok: false };
  }
  return { ok: true };
}

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
    console.log("[Stripe Webhook] checkout.session.completed", {
      id: event.id,
      metadataType: session.metadata?.type,
      email: session.metadata?.email ? "(あり)" : "(なし)",
    });

    if (session.metadata?.type === "membership_join") {
      const result = await handleMembershipJoinCompleted(session);
      console.log("[Stripe Webhook] membership_join 処理結果", result);
      return NextResponse.json({ received: true });
    }

    if (session.metadata?.type === "membership_renewal") {
      if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json({ error: "Server config error" }, { status: 500 });
      }
      const supabaseRenew = createClient(supabaseUrl, serviceRoleKey);
      const result = await handleMembershipRenewalCompleted(session, supabaseRenew);
      console.log("[Stripe Webhook] membership_renewal 処理結果", result);
      return NextResponse.json({ received: true });
    }

    if (session.metadata?.type === "mypage_card_setup") {
      if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json({ error: "Server config error" }, { status: 500 });
      }
      const supabaseCard = createClient(supabaseUrl, serviceRoleKey);
      const result = await handleMypageCardSetupCompleted(session, supabaseCard);
      console.log("[Stripe Webhook] mypage_card_setup 処理結果", result);
      return NextResponse.json({ received: true });
    }

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

    if (String(app.payment_status) === "paid") {
      console.log("[Stripe Webhook] application already paid, idempotent skip", applicationId);
      return NextResponse.json({ received: true });
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

    const competitionSlugFromSession =
      typeof session.metadata?.competition_slug === "string"
        ? session.metadata.competition_slug.trim()
        : YOUNG_2026.slug;

    if (isSimultaneousJoin) {
      const joinDate = new Date();
      const expiryDate = new Date(joinDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      const simultaneousSlug = competitionSlugFromSession || YOUNG_2026.slug;

      const { data: newProfile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          name: app.name,
          name_kana: app.furigana,
          email: app.email,
          status: "active",
          category: "general",
          membership_type: "regular",
          simultaneous_join_competition_slug: simultaneousSlug,
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

    const { data: appAfterJoin } = await supabase
      .from("applications")
      .select("profile_id")
      .eq("id", applicationId)
      .single();

    const simultaneousJoinState: "none" | "registered" | "failed" = !isSimultaneousJoin
      ? "none"
      : appAfterJoin?.profile_id
        ? "registered"
        : "failed";

    try {
      await sendCompetitionApplicationPaidEmail(app as Record<string, unknown>, {
        competitionSlug: competitionSlugFromSession,
        simultaneousJoinState,
      });
    } catch (emailErr) {
      const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
      console.error("[コンクール申込メール] 送信失敗:", msg, emailErr);
    }

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
