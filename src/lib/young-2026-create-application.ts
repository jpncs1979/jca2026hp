import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveCompetitionId } from "@/lib/competition-application-gate";
import { joinAddressLine } from "@/lib/japanese-address";
import { portraitDataUrlToBuffer } from "@/lib/portrait-image";
import { YOUNG_2026, isYoung2026ApplicationOpen } from "@/lib/young-2026";

const PORTRAIT_BUCKET = "competition_portraits";

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
  affiliation: string;
  zip_code: string;
  address_prefecture: string;
  address_city: string;
  address_street: string;
  address_building: string;
  address: string;
  phone: string;
  portrait_data_url: string;
  member_type: "会員" | "非会員";
  member_number: string;
  category: "ジュニアA" | "ジュニアB" | "ヤング";
  selected_piece_preliminary: string | null;
  selected_piece_final: string | null;
  video_url: string | null;
  accompanist_info: string;
};

export function parseYoung2026ApplicationBody(body: unknown): Young2026ApplicationParsed | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const furigana = typeof o.furigana === "string" ? o.furigana.trim() : "";
  const email = typeof o.email === "string" ? o.email.trim() : "";
  const birth_date = typeof o.birth_date === "string" ? o.birth_date.trim() : "";
  const affiliation = typeof o.affiliation === "string" ? o.affiliation.trim() : "";
  const zip_code = typeof o.zip_code === "string" ? o.zip_code.trim() : "";
  const address_prefecture =
    typeof o.address_prefecture === "string" ? o.address_prefecture.trim() : "";
  const address_city = typeof o.address_city === "string" ? o.address_city.trim() : "";
  const address_street = typeof o.address_street === "string" ? o.address_street.trim() : "";
  const address_building =
    typeof o.address_building === "string" ? o.address_building.trim() : "";
  const phone = typeof o.phone === "string" ? o.phone.trim() : "";
  const portrait_data_url =
    typeof o.portrait_data_url === "string" ? o.portrait_data_url.trim() : "";
  const member_type = typeof o.member_type === "string" ? o.member_type.trim() : "";
  const category = typeof o.category === "string" ? o.category.trim() : "";
  const member_number = typeof o.member_number === "string" ? o.member_number : "";
  if (
    !name ||
    !furigana ||
    !email ||
    !birth_date ||
    !affiliation ||
    !zip_code ||
    !address_prefecture ||
    !address_city ||
    !address_street ||
    !phone ||
    !portrait_data_url ||
    !member_type ||
    !category
  ) {
    return null;
  }
  if (member_type !== "会員" && member_type !== "非会員") return null;
  if (category !== "ジュニアA" && category !== "ジュニアB" && category !== "ヤング") return null;
  if (!portraitDataUrlToBuffer(portrait_data_url)) return null;

  const address = joinAddressLine({
    prefecture: address_prefecture,
    city: address_city,
    street: address_street,
    building: address_building,
  });

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
    typeof o.accompanist_info === "string" ? o.accompanist_info.trim() : "";
  if (!accompanist_info) return null;

  return {
    name,
    furigana,
    email,
    birth_date,
    affiliation,
    zip_code,
    address_prefecture,
    address_city,
    address_street,
    address_building,
    address,
    phone,
    portrait_data_url,
    member_type,
    member_number,
    category,
    selected_piece_preliminary,
    selected_piece_final,
    video_url,
    accompanist_info,
  };
}

async function uploadPortrait(
  db: SupabaseClient,
  applicationId: string,
  dataUrl: string
): Promise<string | null> {
  const decoded = portraitDataUrlToBuffer(dataUrl);
  if (!decoded) return null;
  const path = `young-2026/${applicationId}.${decoded.ext}`;
  const { error } = await db.storage.from(PORTRAIT_BUCKET).upload(path, decoded.buffer, {
    contentType: decoded.contentType,
    upsert: true,
  });
  if (error) {
    console.error("[young-2026] portrait upload", error);
    return null;
  }
  return path;
}

/**
 * ヤングコンクール申込レコードを作成（会員照合・年齢チェック込み）。
 */
export async function createYoung2026Application(
  db: SupabaseClient,
  body: unknown,
  payment_route: Young2026ApplicationPaymentRoute,
  options?: { adminPeriodBypass?: boolean }
): Promise<
  | {
      ok: true;
      applicationId: string;
      amount: number;
      parsed: Young2026ApplicationParsed;
    }
  | { ok: false; message: string; status?: number }
> {
  if (!isYoung2026ApplicationOpen() && !options?.adminPeriodBypass) {
    return {
      ok: false,
      message: `申込受付期間は${YOUNG_2026.applicationPeriod}です。`,
      status: 400,
    };
  }

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

  const competitionId = await resolveCompetitionId(
    db,
    YOUNG_2026.slug,
    options?.adminPeriodBypass === true
  );
  if (!competitionId) {
    return { ok: false, message: "申込の準備ができていません。", status: 500 };
  }

  const isActiveMember = parsed.member_type === "会員";
  const amount = getAmount(parsed.category, parsed.member_type, isActiveMember);

  const insertRow: Record<string, unknown> = {
    competition_id: competitionId,
    name: parsed.name,
    furigana: parsed.furigana,
    email: parsed.email,
    birth_date: parsed.birth_date,
    age_at_reference: age,
    affiliation: parsed.affiliation,
    zip_code: parsed.zip_code,
    address: parsed.address,
    address_prefecture: parsed.address_prefecture,
    address_city: parsed.address_city,
    address_street: parsed.address_street,
    address_building: parsed.address_building || null,
    phone: parsed.phone,
    member_type: parsed.member_type,
    member_number: null,
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
    (insertError.message?.includes("payment_route") ||
      insertError.message?.includes("zip_code") ||
      insertError.message?.includes("address_prefecture") ||
      insertError.message?.includes("phone") ||
      insertError.message?.includes("affiliation") ||
      insertError.message?.includes("column"))
  ) {
    // payment_route のみ古い環境向けに落とす。連絡先列が無い場合はマイグレーション必須
    if (
      insertError.message?.includes("zip_code") ||
      insertError.message?.includes("address_prefecture") ||
      insertError.message?.includes("phone") ||
      insertError.message?.includes("address_city") ||
      insertError.message?.includes("affiliation")
    ) {
      return {
        ok: false,
        message:
          "申込フォームの更新に必要なデータベース設定が未完了です。事務局へお問い合わせください。",
        status: 500,
      };
    }
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

  const applicationId = app.id as string;
  const portraitPath = await uploadPortrait(db, applicationId, parsed.portrait_data_url);
  if (portraitPath) {
    const { error: pathErr } = await db
      .from("applications")
      .update({ portrait_path: portraitPath })
      .eq("id", applicationId);
    if (pathErr) {
      console.error("[young-2026] portrait_path update", pathErr);
    }
  } else {
    console.error("[young-2026] portrait upload failed for", applicationId);
  }

  return { ok: true, applicationId, amount, parsed };
}
