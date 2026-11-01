import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 第19回アンコン「会員」申込の会員照合（会員番号は使わない・2026-11-01 大和田氏指示）。
 * 演奏者のうち会員1名の「氏名・メールアドレス・生年月日」を入力してもらい、
 * 生年月日が一致し、かつ「氏名」または「メールアドレス」のどちらかが一致する会員がいれば OK。
 */

export type Ensemble2027MemberVerifyResult =
  | { ok: true; memberNumber: number | null; memberName: string }
  | { ok: false; message: string };

/** 氏名の比較用：空白（全角・半角）を除き、全角英数を半角に */
function normName(s: string): string {
  return s.normalize("NFKC").replace(/\s+/g, "").trim();
}

function normBirth(s: string): string {
  return s.replace(/\//g, "-").trim().slice(0, 10);
}

export async function verifyEnsemble2027Member(
  db: SupabaseClient,
  input: { name: string; email: string; birthDateRaw: string }
): Promise<Ensemble2027MemberVerifyResult> {
  const birth = normBirth(input.birthDateRaw);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birth)) {
    return { ok: false, message: "会員の方の生年月日を入力してください。" };
  }
  const inName = normName(input.name);
  const inEmail = input.email.trim().toLowerCase();
  if (!inName && !inEmail) {
    return { ok: false, message: "会員の方の氏名またはメールアドレスを入力してください。" };
  }

  const { data, error } = await db
    .from("profiles")
    .select("name, email, member_number")
    .eq("birth_date", birth);
  if (error) {
    return { ok: false, message: "会員情報の確認に失敗しました。時間をおいてお試しください。" };
  }

  const hit = (data ?? []).find((p) => {
    const nameOk = inName !== "" && normName(String(p.name ?? "")) === inName;
    const emailOk = inEmail !== "" && String(p.email ?? "").trim().toLowerCase() === inEmail;
    return nameOk || emailOk;
  });

  if (!hit) {
    return {
      ok: false,
      message:
        "会員データと一致しませんでした。会員の方の氏名・メールアドレス・生年月日を、協会に登録している内容でご確認ください。分からない場合は事務局へお問い合わせください。",
    };
  }

  return {
    ok: true,
    memberNumber: typeof hit.member_number === "number" ? hit.member_number : null,
    memberName: String(hit.name ?? ""),
  };
}
