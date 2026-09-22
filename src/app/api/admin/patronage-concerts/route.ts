import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/is-current-user-admin";
import { PATRONAGE_SELECT_COLS } from "@/lib/patronage-concerts";

export async function GET() {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("patronage_concerts")
    .select(PATRONAGE_SELECT_COLS)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}
