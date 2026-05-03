import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * 事務局による退会処理（会員資格の喪失のみ）。
 * profiles / memberships / payments の行は削除せず、ステータスとログイン紐付けのみ更新する。
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: profileId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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

    const { data: profile, error: fetchError } = await admin
      .from("profiles")
      .select("id, user_id, status")
      .eq("id", profileId)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json({ error: "会員が見つかりません" }, { status: 404 });
    }

    if (profile.status === "expelled") {
      return NextResponse.json(
        {
          error:
            "強制退会（3年未納等）の会員は、会員詳細の案内に従って対応してください。",
        },
        { status: 400 }
      );
    }

    const userId = profile.user_id as string | null;
    const nowIso = new Date().toISOString();

    const baseUpdate: Record<string, unknown> = {
      status: "expired",
      user_id: null,
      updated_at: nowIso,
    };

    let upErr = (
      await admin
        .from("profiles")
        .update({ ...baseUpdate, stripe_customer_id: null })
        .eq("id", profileId)
    ).error;

    if (
      upErr &&
      (upErr.message?.includes("stripe_customer_id") || upErr.message?.includes("column"))
    ) {
      upErr = (await admin.from("profiles").update(baseUpdate).eq("id", profileId)).error;
    }

    if (upErr) {
      console.error("Admin member withdraw (profile):", upErr);
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    if (userId) {
      const { error: authError } = await admin.auth.admin.deleteUser(userId);
      if (authError) {
        console.warn("Admin member withdraw (auth user):", authError);
      }
    }

    return NextResponse.json({ success: true, membership_withdrawn: true });
  } catch (err) {
    console.error("Admin member withdraw error:", err);
    return NextResponse.json(
      { error: "退会処理に失敗しました" },
      { status: 500 }
    );
  }
}

/** 事務局が会員情報を更新 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: profileId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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

    const body = await request.json();
    const {
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
      membership_type,
      is_ica_member,
      ica_requested,
      is_css_user,
      officer_title,
      gender,
      birth_date,
      notes,
      // 会員資格（最新の membership を更新する場合）
      join_date,
      expiry_date,
      payment_method,
    } = body;

    const profileUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) {
      const v = String(name).trim();
      profileUpdate.name = v || "（未入力）";
    }
    if (name_kana !== undefined) {
      const v = String(name_kana).trim();
      profileUpdate.name_kana = v || "（未入力）";
    }
    if (email !== undefined) {
      const v = String(email).trim();
      profileUpdate.email = v || "";
    }
    if (zip_code !== undefined) profileUpdate.zip_code = zip_code ? String(zip_code).trim() : null;
    if (address !== undefined) profileUpdate.address = address ? String(address).trim() : null;
    if (address_prefecture !== undefined) {
      profileUpdate.address_prefecture = address_prefecture
        ? String(address_prefecture).trim()
        : null;
    }
    if (address_city !== undefined) {
      profileUpdate.address_city = address_city ? String(address_city).trim() : null;
    }
    if (address_street !== undefined) {
      profileUpdate.address_street = address_street ? String(address_street).trim() : null;
    }
    if (address_building !== undefined) {
      profileUpdate.address_building =
        address_building != null && String(address_building).trim() !== ""
          ? String(address_building).trim()
          : null;
    }
    if (phone !== undefined) profileUpdate.phone = phone ? String(phone).trim() : null;
    if (affiliation !== undefined) profileUpdate.affiliation = affiliation ? String(affiliation).trim() : null;
    if (status !== undefined) {
      const s = String(status);
      if (["pending", "active", "expired", "expelled"].includes(s)) profileUpdate.status = s;
    }
    // membership_type: 004で friend を追加。003のみの場合は regular/student/supporting のみ許可
    const VALID_MEMBERSHIP_004 = ["regular", "student", "supporting", "friend"];
    const VALID_MEMBERSHIP_003 = ["regular", "student", "supporting"];
    if (membership_type !== undefined) {
      const m = String(membership_type);
      if (VALID_MEMBERSHIP_004.includes(m)) profileUpdate.membership_type = m;
    }
    // 基本カラム（マイグレーション003）とオプションカラム（マイグレーション004）を分離
    const optionalUpdate: Record<string, unknown> = {};
    if (is_ica_member !== undefined) {
      const v = Boolean(is_ica_member);
      optionalUpdate.is_ica_member = v;
      optionalUpdate.ica_requested = v;
    } else if (ica_requested !== undefined) {
      const v = Boolean(ica_requested);
      optionalUpdate.ica_requested = v;
      optionalUpdate.is_ica_member = v;
    }
    if (is_css_user !== undefined) optionalUpdate.is_css_user = Boolean(is_css_user);
    if (officer_title !== undefined) optionalUpdate.officer_title = officer_title === "" || officer_title == null ? null : String(officer_title).trim();
    if (gender !== undefined) optionalUpdate.gender = gender ? String(gender).trim() : null;
    if (birth_date !== undefined) optionalUpdate.birth_date = birth_date ? String(birth_date).trim() : null;
    if (notes !== undefined) optionalUpdate.notes = notes ? String(notes).trim() : null;

    let profileError = (await admin
      .from("profiles")
      .update(profileUpdate)
      .eq("id", profileId)).error;

    if (
      profileError &&
      (profileError.message?.includes("address_prefecture") ||
        profileError.message?.includes("address_city") ||
        profileError.message?.includes("address_street") ||
        profileError.message?.includes("address_building") ||
        profileError.message?.includes("column"))
    ) {
      delete profileUpdate.address_prefecture;
      delete profileUpdate.address_city;
      delete profileUpdate.address_street;
      delete profileUpdate.address_building;
      const retryAddr = await admin.from("profiles").update(profileUpdate).eq("id", profileId);
      profileError = retryAddr.error;
    }

    // membership_type_check 違反時: 004未適用で friend が使えない場合、regular で再試行
    if (profileError?.message?.includes("membership_type") || profileError?.message?.includes("check constraint")) {
      const mt = profileUpdate.membership_type as string;
      if (mt === "friend" || !VALID_MEMBERSHIP_003.includes(mt)) {
        delete profileUpdate.membership_type;
        profileUpdate.membership_type = "regular";
        const retry = await admin.from("profiles").update(profileUpdate).eq("id", profileId);
        profileError = retry.error;
      }
    }
    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // オプションカラム（004で追加）が存在する場合のみ更新
    if (Object.keys(optionalUpdate).length > 0) {
      const fullOptional = { ...optionalUpdate, updated_at: new Date().toISOString() };
      const { error: optError } = await admin
        .from("profiles")
        .update(fullOptional)
        .eq("id", profileId);
      // カラムが無い場合はエラーになるが、基本更新は成功しているので無視
      if (optError?.message?.includes("column") || optError?.message?.includes("schema")) {
        // マイグレーション004未適用のためスキップ
      } else if (optError) {
        return NextResponse.json({ error: optError.message }, { status: 500 });
      }
    }

    // 会員資格の更新（join_date, expiry_date, payment_method が指定された場合）
    if (join_date !== undefined || expiry_date !== undefined || payment_method !== undefined) {
      const { data: memList } = await admin
        .from("memberships")
        .select("id")
        .eq("profile_id", profileId)
        .order("expiry_date", { ascending: false })
        .limit(1);
      const latestMembership = memList?.[0];

      const membershipUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (join_date !== undefined) membershipUpdate.join_date = String(join_date).slice(0, 10);
      if (expiry_date !== undefined) membershipUpdate.expiry_date = String(expiry_date).slice(0, 10);
      if (payment_method !== undefined) {
        const p = String(payment_method);
        if (["stripe", "css", "transfer"].includes(p)) membershipUpdate.payment_method = p;
      }

      if (latestMembership?.id) {
        await admin
          .from("memberships")
          .update(membershipUpdate)
          .eq("id", latestMembership.id);
      } else if (expiry_date) {
        await admin.from("memberships").insert({
          profile_id: profileId,
          join_date: join_date ? String(join_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
          expiry_date: String(expiry_date).slice(0, 10),
          payment_method: payment_method ?? "transfer",
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin member update error:", err);
    return NextResponse.json(
      { error: "更新に失敗しました" },
      { status: 500 }
    );
  }
}
