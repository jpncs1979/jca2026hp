import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { YOUNG_2026 } from "@/lib/young-2026";
import { normalizeMemberNumberInput } from "@/lib/member-number";

const REFERENCE_DATE = new Date(YOUNG_2026.referenceDate);

function calculateAge(birthDate: Date): number {
  let age = REFERENCE_DATE.getFullYear() - birthDate.getFullYear();
  const m = REFERENCE_DATE.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && REFERENCE_DATE.getDate() < birthDate.getDate())) age--;
  return age;
}

function getAmount(
  category: string,
  memberType: string,
  isActiveMember: boolean
): number {
  if (memberType === "同時入会") {
    const cat = category as keyof typeof YOUNG_2026.fees;
    const participationFee = YOUNG_2026.fees[cat]?.非会員 ?? 10000;
    return participationFee + YOUNG_2026.firstYearMembershipFee;
  }
  const cat = category as keyof typeof YOUNG_2026.fees;
  const fees = YOUNG_2026.fees[cat];
  if (!fees) return 10000;
  return isActiveMember ? fees.会員 : fees.非会員;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      furigana,
      email,
      birth_date,
      member_type,
      member_number,
      category,
      selected_piece_preliminary,
      selected_piece_final,
      video_url,
      accompanist_info,
    } = body;

    if (!name || !furigana || !email || !birth_date || !member_type || !category) {
      return NextResponse.json(
        { error: "必須項目が入力されていません。" },
        { status: 400 }
      );
    }

    const birth = new Date(birth_date);
    if (isNaN(birth.getTime())) {
      return NextResponse.json(
        { error: "生年月日が不正です。" },
        { status: 400 }
      );
    }

    const age = calculateAge(birth);
    const cat = YOUNG_2026.eligibility.categories.find((c) => c.id === category);
    if (cat && age > cat.maxAge) {
      return NextResponse.json(
        { error: "2026年4月1日時点の年齢が部門の上限を超えています。" },
        { status: 400 }
      );
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!stripeSecret || !supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "決済の準備ができていません。" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: comp } = await supabase
      .from("competitions")
      .select("id")
      .eq("slug", YOUNG_2026.slug)
      .single();

    if (!comp?.id) {
      return NextResponse.json(
        { error: "申込の準備ができていません。" },
        { status: 500 }
      );
    }

    const memberNumberNorm =
      member_type === "会員" ? normalizeMemberNumberInput(member_number) : null;
    if (member_type === "会員" && !memberNumberNorm) {
      return NextResponse.json(
        { error: "会員の場合は有効な会員番号を入力してください（例: 0001）。" },
        { status: 400 }
      );
    }

    // ログイン中の会員かどうか（将来: auth から profile を取得して status を確認）
    const isActiveMember = member_type === "会員" && !!memberNumberNorm;
    const amount = getAmount(category, member_type, isActiveMember);

    const { data: app, error: insertError } = await supabase
      .from("applications")
      .insert({
        competition_id: comp.id,
        name,
        furigana,
        email,
        birth_date,
        age_at_reference: age,
        member_type,
        member_number: memberNumberNorm,
        category,
        selected_piece_preliminary: selected_piece_preliminary || null,
        selected_piece_final:
          category === "ジュニアB" || category === "ヤング"
            ? selected_piece_final || null
            : null,
        video_url:
          YOUNG_2026.requiresVideo.includes(category as "ジュニアA" | "ジュニアB")
            ? video_url || null
            : null,
        accompanist_info: accompanist_info || null,
        payment_status: "pending",
        amount,
      })
      .select("id")
      .single();

    if (insertError || !app?.id) {
      return NextResponse.json(
        { error: insertError?.message ?? "申込の保存に失敗しました。" },
        { status: 500 }
      );
    }

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
              description: `${category}部門${member_type === "同時入会" ? "（同時入会含む）" : ""}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        application_id: app.id,
        competition_slug: YOUNG_2026.slug,
        member_type,
      },
      success_url: `${baseUrl}/events/young-2026/apply/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/events/young-2026/apply`,
      customer_email: email,
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
