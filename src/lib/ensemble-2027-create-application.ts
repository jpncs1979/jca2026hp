import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveCompetitionId } from "@/lib/competition-application-gate";
import { ENSEMBLE_2027, type Ensemble2027CategoryId } from "@/lib/ensemble-2027";
import { isEnsemble2027ApplicationOpen } from "@/lib/ensemble-2027";
import { normalizeMemberNumberInput } from "@/lib/member-number";
import { verifyYoung2026MemberCredentials } from "@/lib/young-2026-verify-member";

const CATEGORY_IDS = ENSEMBLE_2027.categories.map((c) => c.id);

function getAmount(category: Ensemble2027CategoryId, memberType: string): number {
  const fees = ENSEMBLE_2027.fees[category];
  if (!fees) return 8000;
  return memberType === "会員" ? fees.会員 : fees.非会員;
}

export type Ensemble2027ApplicationPaymentRoute = "stripe_card";

export type Ensemble2027ApplicationParsed = {
  /** 団体名 */
  name: string;
  /** 団体名ふりがな */
  furigana: string;
  email: string;
  /** 代表者生年月日 */
  birth_date: string;
  member_type: "会員" | "非会員";
  member_number: string;
  category: Ensemble2027CategoryId;
  /** 代表者氏名 */
  representative_name: string;
  /** 代表者電話 */
  phone: string;
  /** 演奏曲名 */
  program_title: string;
  /** 団体人数・メンバー名簿等 */
  ensemble_details: string;
  video_url: string | null;
};

export function parseEnsemble2027ApplicationBody(body: unknown): Ensemble2027ApplicationParsed | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const furigana = typeof o.furigana === "string" ? o.furigana.trim() : "";
  const email = typeof o.email === "string" ? o.email.trim() : "";
  const birth_date = typeof o.birth_date === "string" ? o.birth_date.trim() : "";
  const member_type = typeof o.member_type === "string" ? o.member_type.trim() : "";
  const category = typeof o.category === "string" ? o.category.trim() : "";
  const member_number = typeof o.member_number === "string" ? o.member_number : "";
  const representative_name =
    typeof o.representative_name === "string" ? o.representative_name.trim() : "";
  const phone = typeof o.phone === "string" ? o.phone.trim() : "";
  const program_title = typeof o.program_title === "string" ? o.program_title.trim() : "";
  const ensemble_details =
    typeof o.ensemble_details === "string" ? o.ensemble_details.trim() : "";

  if (
    !name ||
    !furigana ||
    !email ||
    !birth_date ||
    !member_type ||
    !category ||
    !representative_name ||
    !phone ||
    !program_title ||
    !ensemble_details
  ) {
    return null;
  }
  if (member_type !== "会員" && member_type !== "非会員") return null;
  if (!CATEGORY_IDS.includes(category as Ensemble2027CategoryId)) return null;

  const video_url =
    typeof o.video_url === "string" && o.video_url.trim() ? o.video_url.trim() : null;

  return {
    name,
    furigana,
    email,
    birth_date,
    member_type,
    member_number,
    category: category as Ensemble2027CategoryId,
    representative_name,
    phone,
    program_title,
    ensemble_details,
    video_url,
  };
}

export async function createEnsemble2027Application(
  db: SupabaseClient,
  body: unknown,
  payment_route: Ensemble2027ApplicationPaymentRoute,
  options?: { adminPeriodBypass?: boolean }
): Promise<
  | {
      ok: true;
      applicationId: string;
      amount: number;
      parsed: Ensemble2027ApplicationParsed;
    }
  | { ok: false; message: string; status?: number }
> {
  if (!isEnsemble2027ApplicationOpen() && !options?.adminPeriodBypass) {
    return {
      ok: false,
      message: `申込受付期間は${ENSEMBLE_2027.applicationPeriod}です。`,
      status: 400,
    };
  }

  const parsed = parseEnsemble2027ApplicationBody(body);
  if (!parsed) {
    return { ok: false, message: "必須項目が入力されていません。", status: 400 };
  }

  const birth = new Date(parsed.birth_date);
  if (Number.isNaN(birth.getTime())) {
    return { ok: false, message: "代表者の生年月日が不正です。", status: 400 };
  }

  const memberNumberNorm =
    parsed.member_type === "会員" ? normalizeMemberNumberInput(parsed.member_number) : null;
  if (parsed.member_type === "会員" && !memberNumberNorm) {
    return {
      ok: false,
      message: "会員価格でお申し込みの場合は、有効な会員番号を入力してください（例: 0001）。",
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

  const competitionId = await resolveCompetitionId(
    db,
    ENSEMBLE_2027.slug,
    options?.adminPeriodBypass === true
  );
  if (!competitionId) {
    return { ok: false, message: "申込の準備ができていません。", status: 500 };
  }

  const amount = getAmount(parsed.category, parsed.member_type);

  const accompanist_info = [
    `代表者氏名：${parsed.representative_name}`,
    `電話：${parsed.phone}`,
    `演奏曲：${parsed.program_title}`,
    parsed.ensemble_details,
  ].join("\n");

  const insertRow: Record<string, unknown> = {
    competition_id: competitionId,
    name: parsed.name,
    furigana: parsed.furigana,
    email: parsed.email,
    birth_date: parsed.birth_date,
    age_at_reference: 0,
    member_type: parsed.member_type,
    member_number: memberNumberNorm,
    category: parsed.category,
    selected_piece_preliminary: parsed.representative_name,
    selected_piece_final: parsed.phone,
    video_url: parsed.video_url,
    accompanist_info,
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
