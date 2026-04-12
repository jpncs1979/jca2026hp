import type { SupabaseClient } from "@supabase/supabase-js";
import { parseMemberNumberCell } from "@/lib/member-number";

export type Young2026MemberVerifyErrorCode =
  | "invalid_member_number"
  | "not_found"
  | "email_mismatch"
  | "birth_mismatch"
  | "birth_missing";

export type Young2026MemberVerifyResult =
  | { ok: true }
  | { ok: false; code: Young2026MemberVerifyErrorCode; message: string };

const MESSAGES: Record<Young2026MemberVerifyErrorCode, string> = {
  invalid_member_number: "会員番号の形式が正しくありません。",
  not_found:
    "この会員番号の会員が見つかりません。会員番号をご確認ください。",
  email_mismatch:
    "会員番号に紐づくメールアドレスと一致しません。会員登録のメールアドレスを入力してください。",
  birth_mismatch:
    "会員番号に紐づく生年月日と一致しません。会員登録の生年月日を入力してください。",
  birth_missing:
    "会員データに生年月日が登録されていないため照合できません。事務局へお問い合わせください。",
};

/**
 * ヤングコンクール申込で「会員」のとき、会員番号・メール・生年月日が DB の会員情報と一致するか検証する。
 */
export async function verifyYoung2026MemberCredentials(
  admin: SupabaseClient,
  input: { memberNumberRaw: string; email: string; birthDateRaw: string }
): Promise<Young2026MemberVerifyResult> {
  const num = parseMemberNumberCell(input.memberNumberRaw);
  if (num == null) {
    return {
      ok: false,
      code: "invalid_member_number",
      message: MESSAGES.invalid_member_number,
    };
  }

  const { data: profile, error } = await admin
    .from("profiles")
    .select("email, birth_date")
    .eq("member_number", num)
    .maybeSingle();

  if (error || !profile) {
    return { ok: false, code: "not_found", message: MESSAGES.not_found };
  }

  const dbEmail = (typeof profile.email === "string" ? profile.email : "").trim().toLowerCase();
  const inEmail = input.email.trim().toLowerCase();
  if (dbEmail !== inEmail) {
    return { ok: false, code: "email_mismatch", message: MESSAGES.email_mismatch };
  }

  const dbBirth = profile.birth_date as string | null | undefined;
  if (dbBirth == null || String(dbBirth).trim() === "") {
    return { ok: false, code: "birth_missing", message: MESSAGES.birth_missing };
  }

  const inputNorm = input.birthDateRaw.replace(/\//g, "-").trim().slice(0, 10);
  const dbNorm = String(dbBirth).split("T")[0]!.slice(0, 10);

  if (inputNorm !== dbNorm) {
    return { ok: false, code: "birth_mismatch", message: MESSAGES.birth_mismatch };
  }

  return { ok: true };
}
