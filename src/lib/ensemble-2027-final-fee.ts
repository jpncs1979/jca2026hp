import { createHmac, timingSafeEqual } from "node:crypto";
import { ENSEMBLE_2027, type Ensemble2027CategoryId } from "@/lib/ensemble-2027";

/**
 * 第19回アンコン 本選参加料（予選通過団体のみ・演奏者1人ごと）。
 * 事務局が通過通知メールに貼る「団体ごとの支払いリンク」を作り、検証する。
 * リンクには申込IDと、サーバーの秘密鍵から作った署名が入る（他団体のリンクは推測できない）。
 */

export const ENSEMBLE_2027_FINAL_FEE_PATH = "/events/ensemble/final-fee";

/** 演奏者数の上限（入力ミス防止） */
export const ENSEMBLE_2027_FINAL_MAX_PERFORMERS = 40;
export const ENSEMBLE_2027_FINAL_MIN_PERFORMERS = 2;

function signingKey(): string {
  const key = process.env.ENSEMBLE_FINAL_FEE_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("支払いリンクの署名鍵がありません（SUPABASE_SERVICE_ROLE_KEY）");
  return key;
}

export function signEnsemble2027FinalFeeToken(applicationId: string): string {
  return createHmac("sha256", signingKey())
    .update(`ensemble-2027-final-fee:${applicationId}`)
    .digest("base64url")
    .slice(0, 32);
}

export function verifyEnsemble2027FinalFeeToken(applicationId: string, token: string): boolean {
  if (!applicationId || !token) return false;
  const expected = Buffer.from(signEnsemble2027FinalFeeToken(applicationId));
  const actual = Buffer.from(token);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export function ensemble2027FinalFeeUrl(baseUrl: string, applicationId: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const t = signEnsemble2027FinalFeeToken(applicationId);
  return `${base}${ENSEMBLE_2027_FINAL_FEE_PATH}?id=${encodeURIComponent(applicationId)}&t=${t}`;
}

/** 1人あたりの本選参加料（演奏者に会員が1人以上いれば団体全員が会員価格） */
export function ensemble2027FinalUnitFee(category: string, memberType: string): number | null {
  const fees = ENSEMBLE_2027.finalParticipationFees[category as Ensemble2027CategoryId];
  if (!fees) return null;
  return memberType === "会員" ? fees.会員 : fees.非会員;
}

export function parsePerformerCount(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw.trim()) : NaN;
  if (!Number.isInteger(n)) return null;
  if (n < ENSEMBLE_2027_FINAL_MIN_PERFORMERS || n > ENSEMBLE_2027_FINAL_MAX_PERFORMERS) return null;
  return n;
}

/** 支払いページ・APIで使う申込行の列 */
export const ENSEMBLE_2027_FINAL_FEE_COLUMNS =
  "id, competition_id, name, email, category, member_type, payment_status, final_fee_status, final_fee_amount, final_performer_count, final_fee_paid_at";

export type Ensemble2027FinalFeeApplication = {
  id: string;
  competition_id: string;
  name: string;
  email: string | null;
  category: string;
  member_type: string;
  payment_status: string;
  final_fee_status: "paid" | "free" | null;
  final_fee_amount: number | null;
  final_performer_count: number | null;
  final_fee_paid_at: string | null;
};
