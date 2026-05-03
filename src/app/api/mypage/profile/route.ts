import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { joinAddressLine } from "@/lib/japanese-address";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const body = await request.json();
    const {
      zip_code,
      address,
      address_prefecture,
      address_city,
      address_street,
      address_building,
      phone,
      affiliation,
    } = body as Record<string, unknown>;

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

    const pref = typeof address_prefecture === "string" ? address_prefecture.trim() : "";
    const city = typeof address_city === "string" ? address_city.trim() : "";
    const street = typeof address_street === "string" ? address_street.trim() : "";
    const building =
      typeof address_building === "string" && address_building.trim() !== ""
        ? address_building.trim()
        : "";
    const lineFromParts = joinAddressLine({
      prefecture: pref,
      city,
      street,
      building,
    });
    const addressLine =
      lineFromParts ||
      (typeof address === "string" && address.trim() !== "" ? address.trim() : null);

    const updatePayload: Record<string, unknown> = {
      zip_code: zip_code ?? null,
      address: addressLine,
      phone: phone ?? null,
      affiliation: affiliation ?? null,
      updated_at: new Date().toISOString(),
      address_prefecture: pref || null,
      address_city: city || null,
      address_street: street || null,
      address_building: building || null,
    };

    let { error } = await admin.from("profiles").update(updatePayload).eq("id", profile.id);

    if (
      error &&
      (error.message?.includes("address_prefecture") ||
        error.message?.includes("address_city") ||
        error.message?.includes("column"))
    ) {
      delete updatePayload.address_prefecture;
      delete updatePayload.address_city;
      delete updatePayload.address_street;
      delete updatePayload.address_building;
      const retry = await admin.from("profiles").update(updatePayload).eq("id", profile.id);
      error = retry.error;
    }

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
