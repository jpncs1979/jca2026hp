import type { SupabaseClient } from "@supabase/supabase-js";
import { YOUNG_2026 } from "@/lib/young-2026";
import { normalizeMemberNumberInput } from "@/lib/member-number";
import { verifyYoung2026MemberCredentials } from "@/lib/young-2026-verify-member";

const REFERENCE_DATE = new Date(YOUNG_2026.referenceDate);

function calculateAge(birthDate: Date): number {
  let age = REFERENCE_DATE.getFullYear() - birthDate.getFullYear();
  const m = REFERENCE_DATE.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && REFERENCE_DATE.getDate() < birthDate.getDate())) age--;
  return age;
}

function getAmount(
  category: string,
  memberType: string,
  isActiveMember: boolean
): number {
  if (memberType === "同時入会") {
    const cat = category as keyof typeof YOUNG_2026.fees;
    const participationFee = YOUNG_2026.fees[cat]?.非会員 ?? 10000;
    return participationFee + YOUNG_2026.firstYearMembershipFee;
  }
  const cat = category as keyof typeof YOUNG_2026.fees;
  const fees = YOUNG_2026.fees[cat];
  if (!fees) return 10000;
  return isActiveMember ? fees.会員 : fees.非会員;
}

export type Young2026ApplicationPaymentRoute = "stripe_card" | "bank_transfer";

export type Young2026ApplicationParsed = {
  name: string;
  furigana: string;
  email: string;
  birth_date: string;
  member_type: "会員" | "非会員" | "同時入会";
  member_number: string;
  category: "ジュニアA" | "ジュニアB" | "ヤング";
  selected_piece_preliminary: string | null;
  selected_piece_final: string | null;
  video_url: string | null;
  accompanist_info: string | null;
};

export function parseYoung2026ApplicationBody(body: unknown): Young2026ApplicationParsed | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const furigana = typeof o.furigana === "string" ? o.furigana.trim() : "";
  const email = typeof o.email === "string" ? o.email.trim() : "";
  const birth_date = typeof o.birth_date === "string" ? o.birth_date.trim() : "";
  const member_type = typeof o.member_type === "string" ? o.member_type.trim() : "";
  const category = typeof o.category === "string" ? o.category.trim() : "";
  const member_number = typeof o.member_number === "string" ? o.member_number : "";
  if (!name || !furigana || !email || !birth_date || !member_type || !category) return null;
  if (member_type !== "会員" && member_type !== "非会員" && member_type !== "同時入会") return null;
  if (category !== "ジュニアA" && category !== "ジュニアB" && category !== "ヤング") return null;

  const selected_piece_preliminary =
    typeof o.selected_piece_preliminary === "string" && o.selected_piece_preliminary.trim()
      ? o.selected_piece_preliminary.trim()
      : null;
  const selected_piece_final =
    typeof o.selected_piece_final === "string" && o.selected_piece_final.trim()
      ? o.selected_piece_final.trim()
      : null;
  const video_url =
    typeof o.video_url === "string" && o.video_url.trim() ? o.video_url.trim() : null;
  const accompanist_info =
    typeof o.accompanist_info === "string" && o.accompanist_info.trim()
      ? o.accompanist_info.trim()
      : null;

  return {
    name,
    furigana,
    email,
    birth_date,
    member_type,
    member_number,
    category,
    selected_piece_preliminary,
    selected_piece_final,
    video_url,
    accompanist_info,
  };
}

/**
 * ヤングコンクール申込レコードを作成（会員照合・年齢チェック込み）。
 */
export async function createYoung2026Application(
  db: SupabaseClient,
  body: unknown,
  payment_route: Young2026ApplicationPaymentRoute
): Promise<
  | {
      ok: true;
      applicationId: string;
      amount: number;
      parsed: Young2026ApplicationParsed;
    }
  | { ok: false; message: string; status?: number }
> {
  const parsed = parseYoung2026ApplicationBody(body);
  if (!parsed) {
    return { ok: false, message: "必須項目が入力されていません。", status: 400 };
  }

  const birth = new Date(parsed.birth_date);
  if (Number.isNaN(birth.getTime())) {
    return { ok: false, message: "生年月日が不正です。", status: 400 };
  }

  const age = calculateAge(birth);
  const cat = YOUNG_2026.eligibility.categories.find((c) => c.id === parsed.category);
  if (cat && age > cat.maxAge) {
    return {
      ok: false,
      message: "2026年4月1日時点の年齢が部門の上限を超えています。",
      status: 400,
    };
  }

  const memberNumberNorm =
    parsed.member_type === "会員" ? normalizeMemberNumberInput(parsed.member_number) : null;
  if (parsed.member_type === "会員" && !memberNumberNorm) {
    return {
      ok: false,
      message: "会員の場合は有効な会員番号を入力してください（例: 0001）。",
      status: 400,
    };
  }

  if (parsed.member_type === "会員" && memberNumberNorm) {
    const verifyResult = await verifyYoung2026MemberCredentials(db, {
      memberNumberRaw: memberNumberNorm,
      email: parsed.email,
      birthDateRaw: parsed.birth_date,
    });
    if (!verifyResult.ok) {
      return { ok: false, message: verifyResult.message, status: 400 };
    }
  }

  const { data: comp, error: compErr } = await db
    .from("competitions")
    .select("id")
    .eq("slug", YOUNG_2026.slug)
    .single();

  if (compErr || !comp?.id) {
    return { ok: false, message: "申込の準備ができていません。", status: 500 };
  }

  const isActiveMember = parsed.member_type === "会員" && !!memberNumberNorm;
  const amount = getAmount(parsed.category, parsed.member_type, isActiveMember);

  const insertRow: Record<string, unknown> = {
    competition_id: comp.id,
    name: parsed.name,
    furigana: parsed.furigana,
    email: parsed.email,
    birth_date: parsed.birth_date,
    age_at_reference: age,
    member_type: parsed.member_type,
    member_number: memberNumberNorm,
    category: parsed.category,
    selected_piece_preliminary: parsed.selected_piece_preliminary,
    selected_piece_final:
      parsed.category === "ジュニアB" || parsed.category === "ヤング"
        ? parsed.selected_piece_final
        : null,
    video_url: YOUNG_2026.requiresVideo.includes(
      parsed.category as "ジュニアA" | "ジュニアB"
    )
      ? parsed.video_url
      : null,
    accompanist_info: parsed.accompanist_info,
    payment_status: "pending",
    amount,
    payment_route,
  };

  let { data: app, error: insertError } = await db
    .from("applications")
    .insert(insertRow)
    .select("id")
    .single();

  if (
    insertError &&
    (insertError.message?.includes("payment_route") || insertError.message?.includes("column"))
  ) {
    delete insertRow.payment_route;
    const retry = await db.from("applications").insert(insertRow).select("id").single();
    app = retry.data;
    insertError = retry.error;
  }

  if (insertError || !app?.id) {
    return {
      ok: false,
      message: insertError?.message ?? "申込の保存に失敗しました。",
      status: 500,
    };
  }

  return { ok: true, applicationId: app.id as string, amount, parsed };
}
