import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { getFromHeader } from "@/lib/email";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** 入会決済完了時: プロフィール・会員契約・入金記録を作成し、入会完了メールを送信 */
async function handleMembershipJoinCompleted(
  session: Stripe.Checkout.Session
): Promise<{ ok: boolean }> {
  const meta = session.metadata;
  if (!meta || meta.type !== "membership_join" || !meta.email || !meta.name) {
    return { ok: false };
  }

  if (!supabaseUrl || !serviceRoleKey) return { ok: false };
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const joinDate = new Date();
  const expiryDate = new Date(joinDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

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
      ica_requested: meta.ica_requested === "1",
      is_css_user: true,
    })
    .select("id")
    .single();

  if (profileError || !newProfile) {
    console.error("Membership join: profile insert failed", profileError);
    return { ok: false };
  }

  await supabase.from("memberships").insert({
    profile_id: newProfile.id,
    join_date: joinDate.toISOString().slice(0, 10),
    expiry_date: expiryDate.toISOString().slice(0, 10),
    payment_method: "stripe",
  });

  const amount = session.amount_total ?? 0;
  await supabase.from("payments").insert({
    profile_id: newProfile.id,
    amount,
    purpose: "membership_fee",
    method: "stripe",
    transaction_id: session.payment_intent as string,
    metadata: { checkout_session_id: session.id },
  });

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
          （マイページをご利用になるには、このメールアドレスでアカウント登録が必要です。）</p>
          <p>ご不明な点がございましたら、事務局までお問い合わせください。</p>
          <hr />
          <p>一般社団法人 日本クラリネット協会事務局</p>
        `,
        });
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
            <li>ICA会員入会希望：${meta.ica_requested === "1" ? "はい" : "いいえ"}</li>
          </ul>
          <p>管理画面の会員一覧でご確認ください。</p>
          <hr />
          <p>一般社団法人 日本クラリネット協会</p>
        `,
        });
      } catch (emailErr) {
        const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
        console.error("[事務局通知メール送信エラー]", msg, emailErr);
      }
    }
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

    if (session.metadata?.type === "membership_join") {
      await handleMembershipJoinCompleted(session);
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
