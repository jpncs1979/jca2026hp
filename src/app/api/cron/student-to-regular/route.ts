import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const header = request.headers.get("x-cron-secret");
  return header === secret;
}

/**
 * 26歳ルール: 学生会員のうち、26歳に達した年度の会員を正会員に自動昇格させる。
 * 毎年1月に実行する想定（Vercel Cron または手動）。
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Server config error" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const currentYear = new Date().getFullYear();

  // birth_date の年 + 26 <= currentYear となる学生会員を取得
  const { data: profiles, error: fetchError } = await supabase
    .from("profiles")
    .select("id, name, email, birth_date, membership_type")
    .eq("membership_type", "student")
    .not("birth_date", "is", null);

  if (fetchError) {
    console.error("student-to-regular fetch error:", fetchError);
    return NextResponse.json(
      { error: fetchError.message },
      { status: 500 }
    );
  }

  const toUpgrade = (profiles ?? []).filter((p) => {
    if (!p.birth_date) return false;
    const birthYear = new Date(p.birth_date).getFullYear();
    return birthYear + 26 <= currentYear;
  });

  if (toUpgrade.length === 0) {
    return NextResponse.json({
      ok: true,
      message: "昇格対象者なし",
      upgraded: 0,
    });
  }

  const ids = toUpgrade.map((p) => p.id);
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      membership_type: "regular",
      updated_at: new Date().toISOString(),
    })
    .in("id", ids);

  if (updateError) {
    console.error("student-to-regular update error:", updateError);
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    upgraded: ids.length,
    profile_ids: ids,
  });
}
