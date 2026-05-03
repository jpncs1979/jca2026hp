import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  fiscalYearForDate,
  formatFiscalYearLabel,
  membershipEligibilityEndIsoFromMaxPaidBusinessFiscalYear,
} from "@/lib/membership-fiscal-year";

/**
 * 承認待ち（pending）会員を有効化する。
 * 会員資格の末日 = 承認日を含む会費事業年度 N に対応する (N+1)年3月31日（既存の会員年度定義に整合）。
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: profileId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "未認証" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: adminProfile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!adminProfile?.is_admin) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { data: profile, error: fetchErr } = await admin
      .from("profiles")
      .select("id, status")
      .eq("id", profileId)
      .single();

    if (fetchErr || !profile) {
      return NextResponse.json({ error: "会員が見つかりません" }, { status: 404 });
    }

    if (profile.status !== "pending") {
      return NextResponse.json(
        { error: "承認待ち（pending）の会員のみ承認できます。" },
        { status: 400 }
      );
    }

    const ref = new Date();
    const fy = fiscalYearForDate(ref);
    const expiryDate = membershipEligibilityEndIsoFromMaxPaidBusinessFiscalYear(fy);
    const nowIso = new Date().toISOString();

    const { data: memList } = await admin
      .from("memberships")
      .select("id")
      .eq("profile_id", profileId)
      .order("expiry_date", { ascending: false })
      .limit(1);
    const latestId = memList?.[0]?.id as string | undefined;

    const memPatch = { expiry_date: expiryDate, updated_at: nowIso };
    if (latestId) {
      const { error: mErr } = await admin.from("memberships").update(memPatch).eq("id", latestId);
      if (mErr) {
        return NextResponse.json({ error: mErr.message }, { status: 500 });
      }
    } else {
      const join = ref.toISOString().slice(0, 10);
      const { error: insErr } = await admin.from("memberships").insert({
        profile_id: profileId,
        join_date: join,
        expiry_date: expiryDate,
        payment_method: "transfer",
      });
      if (insErr) {
        return NextResponse.json({ error: insErr.message }, { status: 500 });
      }
    }

    const { error: upErr } = await admin
      .from("profiles")
      .update({ status: "active", updated_at: nowIso })
      .eq("id", profileId);

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      fiscal_year: fy,
      fiscal_year_label: formatFiscalYearLabel(fy),
      expiry_date: expiryDate,
    });
  } catch (err) {
    console.error("approve member:", err);
    return NextResponse.json({ error: "承認に失敗しました。" }, { status: 500 });
  }
}
