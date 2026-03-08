import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const body = await request.json();
    const { zip_code, address, phone, affiliation } = body;

    const admin = createAdminClient();
    let { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile && user.email) {
      const { data: profByEmail } = await admin
        .from("profiles")
        .select("id")
        .is("user_id", null)
        .ilike("email", user.email.trim())
        .maybeSingle();
      profile = profByEmail;
    }

    if (!profile) {
      return NextResponse.json({ error: "プロフィールが見つかりません" }, { status: 404 });
    }

    const { error } = await admin
      .from("profiles")
      .update({
        zip_code: zip_code ?? null,
        address: address ?? null,
        phone: phone ?? null,
        affiliation: affiliation ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json(
      { error: "更新処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
