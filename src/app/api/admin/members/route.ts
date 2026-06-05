import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  FEE_PAYMENT_FILTER_KEYS,
  type FeePaymentFilterKey,
} from "@/lib/excel-fee-payment";
import { feePaymentCategoryKey, type ProfileForMemberCsv } from "@/lib/admin-members-csv";
import {
  attachMemberKindToProfiles,
  filterProfilesForAdminList,
} from "@/lib/admin-member-kind-filter";

const MEMBERSHIP_TYPES = ["regular", "student", "supporting", "friend"] as const;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const icaOnly = searchParams.get("ica") === "1";
    const typeRaw = searchParams.get("type")?.trim() ?? "";
    const unpaidOnly = searchParams.get("unpaid") === "1";
    const payKindRaw = searchParams.get("pay_kind");

    const typeFilter =
      typeRaw === "non_member" ||
      (MEMBERSHIP_TYPES as readonly string[]).includes(typeRaw)
        ? (typeRaw as (typeof MEMBERSHIP_TYPES)[number] | "non_member")
        : "";

    const admin = createAdminClient();
    const selectAll = `
        id,
        member_number,
        name,
        name_kana,
        email,
        zip_code,
        address,
        address_prefecture,
        address_city,
        address_street,
        address_building,
        phone,
        affiliation,
        status,
        category,
        membership_type,
        is_ica_member,
        officer_title,
        gender,
        birth_date,
        notes,
        created_at,
        is_css_user,
        payment_channel,
        payment_channel_note,
        membership_valid_until,
        stripe_customer_id,
        source,
        import_payment_kind,
        memberships(join_date, expiry_date, payment_method)
      `;
    const selectBase = `
        id,
        member_number,
        name,
        name_kana,
        email,
        zip_code,
        address,
        address_prefecture,
        address_city,
        address_street,
        address_building,
        phone,
        affiliation,
        status,
        category,
        membership_type,
        created_at,
        is_css_user,
        stripe_customer_id,
        source,
        import_payment_kind,
        memberships(join_date, expiry_date, payment_method)
      `;

    let q = admin
      .from("profiles")
      .select(selectAll)
      .or("is_admin.eq.false,is_admin.is.null,officer_title.not.is.null")
      .order("member_number", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (icaOnly) {
      q = q.eq("is_ica_member", true);
    }
    if (typeFilter && typeFilter !== "non_member") {
      q = q.eq("membership_type", typeFilter);
    }

    let result = await q;
    let profiles = result.data;
    let error = result.error;

    if (error && (error.message?.includes("column") || (error as { code?: string }).code === "42703")) {
      const fallbackQ = admin
        .from("profiles")
        .select(selectBase)
        .or("is_admin.eq.false,is_admin.is.null")
        .order("member_number", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });
      let fallback = fallbackQ;
      if (typeFilter && typeFilter !== "non_member") {
        fallback = fallback.eq("membership_type", typeFilter);
      }
      const res = await fallback;
      if (res.error) {
        console.error("Admin members API DB error (fallback):", res.error.message);
        return NextResponse.json({ error: res.error.message }, { status: 500 });
      }
      profiles = (res.data ?? []).map((p: Record<string, unknown>) => ({
        ...p,
        is_ica_member: false,
        officer_title: null,
        gender: null,
        birth_date: null,
        notes: null,
        is_css_user: p.is_css_user ?? false,
        stripe_customer_id: p.stripe_customer_id ?? null,
        source: (p as { source?: string | null }).source ?? "signup",
        import_payment_kind: (p as { import_payment_kind?: string | null }).import_payment_kind ?? null,
      }));
      if (icaOnly) {
        profiles = [];
      }
    } else if (error) {
      console.error("Admin members API DB error:", error.message, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let list = profiles ?? [];
    const payKind =
      payKindRaw && (FEE_PAYMENT_FILTER_KEYS as readonly string[]).includes(payKindRaw)
        ? (payKindRaw as FeePaymentFilterKey)
        : null;
    if (payKind) {
      list = (list as ProfileForMemberCsv[]).filter(
        (p) => feePaymentCategoryKey(p) === payKind
      );
    }

    const withKind = await attachMemberKindToProfiles(
      admin,
      list as {
        id: string;
        status: string;
        membership_type: string;
        memberships?: { join_date?: string; expiry_date?: string }[] | null;
        membership_valid_until?: string | null;
      }[]
    );

    const filtered = filterProfilesForAdminList(withKind, typeFilter, unpaidOnly);

    return NextResponse.json({ profiles: filtered });
  } catch (err) {
    console.error("Admin members API error:", err);
    return NextResponse.json(
      { error: "会員一覧の取得に失敗しました。" },
      { status: 500 }
    );
  }
}
