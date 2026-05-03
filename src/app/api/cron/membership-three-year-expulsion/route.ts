import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  EXPEL_REASON_THREE_YEAR_ARREARS,
  shouldExpelActiveMemberForThreeConsecutiveUnpaidFiscalYears,
} from "@/lib/membership-three-year-arrears";
import type { PaymentRowForFee } from "@/lib/membership-fee-status";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const header = request.headers.get("x-cron-secret");
  return header === secret;
}

/**
 * 有効会員のうち、事業年度ベースで直近3年連続会費未納の者を強制退会（status=expelled）に更新する。
 * Vercel Cron 等から日次で呼び出す想定（同一対象は冪等）。
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server config error" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const refDate = new Date();

  const { data: actives, error: fetchErr } = await supabase
    .from("profiles")
    .select(
      `
      id,
      memberships ( join_date, expiry_date )
    `
    )
    .eq("status", "active");

  if (fetchErr) {
    console.error("[three-year-expulsion] fetch profiles:", fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  const rows = actives ?? [];
  if (rows.length === 0) {
    return NextResponse.json({ checked: 0, expelled: 0, ids: [] as string[] });
  }

  const profileIds = rows.map((r) => r.id as string);

  const { data: payRows, error: payErr } = await supabase
    .from("payments")
    .select("profile_id, purpose, method, metadata, membership_fiscal_year, created_at")
    .in("profile_id", profileIds)
    .eq("purpose", "membership_fee");

  if (payErr) {
    console.error("[three-year-expulsion] fetch payments:", payErr);
    return NextResponse.json({ error: payErr.message }, { status: 500 });
  }

  const paymentsByProfile = new Map<string, PaymentRowForFee[]>();
  for (const p of payRows ?? []) {
    const pid = p.profile_id as string;
    const arr = paymentsByProfile.get(pid) ?? [];
    arr.push(p as PaymentRowForFee);
    paymentsByProfile.set(pid, arr);
  }

  const toExpel: string[] = [];

  for (const row of rows) {
    const memberships = (row as { memberships?: { join_date?: string; expiry_date?: string }[] })
      .memberships;
    const mems = memberships ?? [];
    const latest = [...mems].sort((a, b) =>
      (b.expiry_date ?? "").localeCompare(a.expiry_date ?? "")
    )[0];
    const joinDate = latest?.join_date ?? mems[0]?.join_date ?? null;
    const latestExpiry = latest?.expiry_date ?? null;
    const pays = paymentsByProfile.get(row.id as string) ?? [];
    if (
      shouldExpelActiveMemberForThreeConsecutiveUnpaidFiscalYears(
        joinDate,
        pays,
        latestExpiry,
        refDate
      )
    ) {
      toExpel.push(row.id as string);
    }
  }

  let expelled = 0;
  const expelledIds: string[] = [];
  const nowIso = refDate.toISOString();

  for (const id of toExpel) {
    const { error: upErr } = await supabase
      .from("profiles")
      .update({
        status: "expelled",
        expelled_at: nowIso,
        expulsion_reason: EXPEL_REASON_THREE_YEAR_ARREARS,
        updated_at: nowIso,
      })
      .eq("id", id)
      .eq("status", "active");

    if (!upErr) {
      expelled += 1;
      expelledIds.push(id);
    } else {
      console.error("[three-year-expulsion] update failed", id, upErr);
    }
  }

  return NextResponse.json({
    checked: rows.length,
    expelled,
    ids: expelledIds,
  });
}
