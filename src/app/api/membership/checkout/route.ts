import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import {
  getMembershipJoinAmount,
  type MembershipTypeForFee,
} from "@/lib/membership-fees";
import { normalizeBaseUrl } from "@/lib/utils";
import { joinAddressLine } from "@/lib/japanese-address";

const METADATA_TYPE_MEMBERSHIP_JOIN = "membership_join";

export type MembershipCheckoutBody = {
  name: string;
  name_kana: string;
  email: string;
  birth_date: string;
  gender?: string;
  zip_code?: string;
  /** 都道府県（必須） */
  address_prefecture: string;
  /** 市区町村（必須） */
  address_city: string;
  /** 番地（必須） */
  address_street: string;
  /** 建物名・部屋番号（任意） */
  address_building?: string;
  phone?: string;
  affiliation?: "general" | "professional" | "student";
  ica_requested: boolean;
  membership_type: "regular" | "student";
};

function parseBody(body: unknown): MembershipCheckoutBody | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const name_kana = typeof o.name_kana === "string" ? o.name_kana.trim() : "";
  const email = typeof o.email === "string" ? o.email.trim() : "";
  const birth_date = typeof o.birth_date === "string" ? o.birth_date.trim() : "";
  const affiliation =
    o.affiliation === "general" ||
    o.affiliation === "professional" ||
    o.affiliation === "student"
      ? o.affiliation
      : "general";
  const ica_requested = o.ica_requested === true;
  const membership_type =
    o.membership_type === "student" ? "student" : "regular";
  const address_prefecture =
    typeof o.address_prefecture === "string" ? o.address_prefecture.trim() : "";
  const address_city = typeof o.address_city === "string" ? o.address_city.trim() : "";
  const address_street = typeof o.address_street === "string" ? o.address_street.trim() : "";
  const address_building =
    typeof o.address_building === "string" ? o.address_building.trim() : undefined;
  if (!name || !name_kana || !email || !birth_date) return null;
  if (!address_prefecture || !address_city || !address_street) return null;
  const birth = new Date(birth_date.replace(/\//g, "-"));
  if (Number.isNaN(birth.getTime())) return null;
  return {
    name,
    name_kana,
    email,
    birth_date,
    gender: typeof o.gender === "string" ? o.gender.trim() : undefined,
    zip_code: typeof o.zip_code === "string" ? o.zip_code.trim() : undefined,
    address_prefecture,
    address_city,
    address_street,
    address_building,
    phone: typeof o.phone === "string" ? o.phone.trim() : undefined,
    affiliation,
    ica_requested,
    membership_type,
  };
}

export async function POST(request: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecret || !supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "決済の設定が完了していません。" },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "リクエスト形式が不正です。" },
      { status: 400 }
    );
  }

  const data = parseBody(body);
  if (!data) {
    return NextResponse.json(
      {
        error:
          "必須項目（氏名・ふりがな・メール・生年月日・都道府県・市区町村・番地）を正しく入力してください。",
      },
      { status: 400 }
    );
  }

  const addressLine = joinAddressLine({
    prefecture: data.address_prefecture,
    city: data.address_city,
    street: data.address_street,
    building: data.address_building,
  });

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, status")
    .eq("email", data.email)
    .limit(1)
    .maybeSingle();

  if (existing?.status === "expelled") {
    return NextResponse.json(
      {
        error:
          "このメールアドレスは、会費未納による強制退会の対象となっています。再入会は事務局までお問い合わせください。",
        code: "EXPELLED_REJOIN_CONTACT",
      },
      { status: 403 }
    );
  }

  if (existing) {
    return NextResponse.json(
      { error: "このメールアドレスは既に登録されています。" },
      { status: 400 }
    );
  }

  const joinDate = new Date();
  const amount = getMembershipJoinAmount(
    data.membership_type as MembershipTypeForFee,
    joinDate
  );

  const stripe = new Stripe(stripeSecret);
  const rawBase =
    process.env.NEXT_PUBLIC_SITE_URL ??
    request.headers.get("origin") ??
    "http://localhost:3000";
  const baseUrl = normalizeBaseUrl(rawBase);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_creation: "always",
    payment_intent_data: {
      setup_future_usage: "off_session",
    },
    line_items: [
      {
        price_data: {
          currency: "jpy",
          product_data: {
            name: "日本クラリネット協会 入会金・会費",
            description:
              data.membership_type === "student"
                ? "入会金・学生会員会費（事業年度1年分）"
                : "入会金・正会員会費（事業年度1年分）",
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: METADATA_TYPE_MEMBERSHIP_JOIN,
      name: data.name.slice(0, 500),
      name_kana: data.name_kana.slice(0, 500),
      email: data.email.slice(0, 500),
      birth_date: data.birth_date.slice(0, 20),
      gender: (data.gender ?? "").slice(0, 50),
      zip_code: (data.zip_code ?? "").slice(0, 20),
      addr_pref: data.address_prefecture.slice(0, 40),
      addr_city: data.address_city.slice(0, 120),
      addr_str: data.address_street.slice(0, 200),
      addr_bld: (data.address_building ?? "").slice(0, 120),
      address: addressLine.slice(0, 500),
      phone: (data.phone ?? "").slice(0, 50),
      affiliation: data.affiliation ?? "general",
      ica_requested: data.ica_requested ? "1" : "0",
      membership_type: data.membership_type,
    },
    success_url: `${baseUrl}/membership/join/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/membership/join`,
    customer_email: data.email,
  });

  return NextResponse.json({ url: session.url });
}
