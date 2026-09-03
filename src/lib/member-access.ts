import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isMembershipCurrentlyValid } from "@/lib/payment-channel";

/** 会員ゲートで最低限必要なプロフィール列 */
export const MEMBER_PROFILE_SELECT =
  "id, member_number, name, name_kana, email, status, membership_valid_until, membership_type, is_admin";

/**
 * ログインユーザーに対応する profiles 行を取得する。
 * (1) user_id 一致 → (2) user_id 未設定かつ email 一致（インポート会員対応）の順。
 * 列欠落（未適用マイグレーション）時は legacy 列でリトライする。
 */
export async function resolveMemberProfile<T = Record<string, unknown>>(
  admin: SupabaseClient,
  userId: string,
  email: string | null | undefined,
  opts?: { select?: string; selectLegacy?: string }
): Promise<T | null> {
  const select = opts?.select ?? MEMBER_PROFILE_SELECT;
  const selectLegacy = opts?.selectLegacy ?? select;

  const isColumnError = (msg: string | undefined) =>
    !!msg && (msg.includes("column") || msg.includes("does not exist"));

  // 1. user_id
  let { data: profile, error } = await admin
    .from("profiles")
    .select(select)
    .eq("user_id", userId)
    .maybeSingle();
  if (error && isColumnError(error.message) && selectLegacy !== select) {
    const r = await admin
      .from("profiles")
      .select(selectLegacy)
      .eq("user_id", userId)
      .maybeSingle();
    profile = r.data;
    error = r.error;
  }

  // 2. email（インポート会員）
  if (!profile && email) {
    const trimmed = email.trim();
    let { data: byEmail, error: emailErr } = await admin
      .from("profiles")
      .select(select)
      .is("user_id", null)
      .ilike("email", trimmed)
      .maybeSingle();
    if (emailErr && isColumnError(emailErr.message) && selectLegacy !== select) {
      const r2 = await admin
        .from("profiles")
        .select(selectLegacy)
        .is("user_id", null)
        .ilike("email", trimmed)
        .maybeSingle();
      byEmail = r2.data;
    }
    profile = byEmail;
  }

  return (profile as T) ?? null;
}

export type ValidMemberProfile = {
  id: string;
  member_number: number | null;
  name: string | null;
  name_kana: string | null;
  email: string | null;
  status: string;
  membership_valid_until: string | null;
  membership_type: string | null;
  is_admin: boolean | null;
};

export type RequireValidMemberResult =
  | { ok: true; userId: string; profile: ValidMemberProfile }
  | { ok: false; reason: "unauthenticated" | "no_profile" | "not_valid"; profile: ValidMemberProfile | null };

/**
 * 現在のリクエストが「有効な会員」からのものかを判定する。
 * 会員資格判定は isMembershipCurrentlyValid（status='active' かつ資格末日内）。
 * 会費が未納でも資格期限内ならアクセス可（docs/会員データ簡素化_設計書.md の方針）。
 */
export async function requireValidMember(): Promise<RequireValidMemberResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, reason: "unauthenticated", profile: null };
  }

  const admin = createAdminClient();
  const profile = await resolveMemberProfile<ValidMemberProfile>(
    admin,
    user.id,
    user.email
  );
  if (!profile) {
    return { ok: false, reason: "no_profile", profile: null };
  }
  if (!isMembershipCurrentlyValid(profile)) {
    return { ok: false, reason: "not_valid", profile };
  }
  return { ok: true, userId: user.id, profile };
}
