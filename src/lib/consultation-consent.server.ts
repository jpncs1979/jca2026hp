import {
  classifyConsent,
  hashConsentToken,
  isConsentTokenShape,
  type ConsentLookRow,
  type ConsentView,
} from "@/lib/consultation";
import { createAdminClient } from "@/lib/supabase/server";

const CONSENT_COLUMNS =
  "id, consent_token_hash, consent_status, consent_expires_at, status, category, public_name, age, public_question, answer";

export type ConsentRow = ConsentLookRow & { id: string };

export async function findConsentRow(token: string): Promise<{ row: ConsentRow | null; view: ConsentView }> {
  if (!isConsentTokenShape(token)) {
    return { row: null, view: { kind: "not_found" } };
  }

  const admin = createAdminClient();
  const hash = hashConsentToken(token);
  const { data, error } = await admin
    .from("consultation_questions")
    .select(CONSENT_COLUMNS)
    .eq("consent_token_hash", hash)
    .maybeSingle();

  if (error) throw error;
  const row = (data as ConsentRow | null) ?? null;
  return { row, view: classifyConsent(row, token, new Date()) };
}
