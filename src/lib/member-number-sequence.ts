import type { createAdminClient } from "@/lib/supabase/server";
import {
  formatMemberNumber,
  GENERAL_MEMBER_NUMBER_MAX,
  SUPPORTING_MEMBER_NUMBER_START,
} from "@/lib/member-number";

type AdminClient = ReturnType<typeof createAdminClient>;

/** 管理者・事務局アカウントは会員番号を持たない */
export async function clearAdminMemberNumbers(admin: AdminClient): Promise<void> {
  await admin.from("profiles").update({ member_number: null }).eq("is_admin", true);
}

export type ImportMemberNumberCounters = {
  general: number;
  supporting: number;
};

export function createImportMemberNumberCounters(): ImportMemberNumberCounters {
  return { general: 0, supporting: 0 };
}

/**
 * Excel 取り込み行用: 賛助会員は 9001〜、それ以外は 0001〜 の連番。
 * ファイル内の行順で counters を進める。
 */
export function nextMemberNumberForImport(
  membershipType: string,
  counters: ImportMemberNumberCounters
): number {
  if (membershipType === "supporting") {
    counters.supporting++;
    const n = SUPPORTING_MEMBER_NUMBER_START + counters.supporting - 1;
    if (n > 9999) {
      throw new Error(
        `賛助会員の会員番号が上限（${formatMemberNumber(9999, "")}）を超えます。`
      );
    }
    return n;
  }
  counters.general++;
  if (counters.general > GENERAL_MEMBER_NUMBER_MAX) {
    throw new Error(
      `一般会員の会員番号が上限（${formatMemberNumber(GENERAL_MEMBER_NUMBER_MAX, "")}）を超えます。`
    );
  }
  return counters.general;
}
