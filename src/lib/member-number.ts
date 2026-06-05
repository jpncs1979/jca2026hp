/** 会員番号は 4 桁固定（0001〜9999）。DB には整数 1, 2, … で保存 */
export const MEMBER_NUMBER_DIGITS = 4;
export const MEMBER_NUMBER_MAX = 9999;
/** 正会員・学生会員等（賛助以外）の上限 */
export const GENERAL_MEMBER_NUMBER_MAX = 8999;
/** 賛助会員の開始番号 */
export const SUPPORTING_MEMBER_NUMBER_START = 9001;

const EXCEL_DATE_EPOCH_MS = Date.UTC(1899, 11, 30);

/**
 * 会員番号（DB は整数）の表示・CSV 用 4 桁ゼロ埋め（例: 0001）。
 */
export function formatMemberNumber(
  n: number | null | undefined,
  whenNull = "－"
): string {
  if (n == null || Number.isNaN(Number(n))) return whenNull;
  const v = Math.max(0, Math.floor(Number(n)));
  if (v < 1) return whenNull;
  return String(v).padStart(MEMBER_NUMBER_DIGITS, "0");
}

/** 文字列から数字のみ抽出（全角数字対応） */
export function extractMemberNumberDigits(s: string | null | undefined): string {
  const half = String(s ?? "")
    .trim()
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30));
  return half.replace(/\D/g, "");
}

/** CSV / Excel の「0001」形式から整数へ（1〜9999） */
export function parseMemberNumberCell(s: string | null | undefined): number | null {
  const digits = extractMemberNumberDigits(s);
  if (!digits) return null;
  const v = parseInt(digits, 10);
  if (Number.isNaN(v) || v < 1 || v > MEMBER_NUMBER_MAX) return null;
  return v;
}

/** Excel 日付シリアル（1=1900/1/1）を会員番号として復元できるか */
function memberNumberFromExcelDate(d: Date): number | null {
  if (Number.isNaN(d.getTime())) return null;
  const serial = Math.round((d.getTime() - EXCEL_DATE_EPOCH_MS) / 86400000);
  if (serial >= 1 && serial <= MEMBER_NUMBER_MAX) return serial;
  return null;
}

function memberNumberFromNumeric(val: number): number | null {
  if (!Number.isFinite(val)) return null;
  const v = Math.floor(val);
  if (v >= 1 && v <= MEMBER_NUMBER_MAX) return v;
  return null;
}

/**
 * Excel 取り込み用: 数値・日付（日付書式の 0001 等）・文字列を会員番号に。
 */
export function parseMemberNumberFromImportCell(val: unknown): number | null {
  if (val == null || val === "") return null;

  if (typeof val === "number") {
    return memberNumberFromNumeric(val);
  }

  if (val instanceof Date) {
    return memberNumberFromExcelDate(val);
  }

  return parseMemberNumberCell(String(val));
}

/** 会員番号セルに値があるか（空欄は false） */
export function memberNumberImportCellHasValue(val: unknown): boolean {
  if (val == null || val === "") return false;
  if (typeof val === "number") return Number.isFinite(val);
  if (val instanceof Date) return !Number.isNaN(val.getTime());
  return extractMemberNumberDigits(String(val)) !== "";
}

/** エラーメッセージ用の読み取り値表示 */
export function describeMemberNumberImportCell(val: unknown): string {
  if (val == null || val === "") return "（空）";
  if (typeof val === "number") return String(val);
  if (val instanceof Date) {
    return val.toLocaleDateString("ja-JP") + "（Excel日付書式の可能性）";
  }
  const t = String(val).trim();
  return t.length > 40 ? t.slice(0, 40) + "…" : t;
}

/** フォームの会員番号入力を保存・メール用の 4 桁へ。空・解釈不能なら null */
export function normalizeMemberNumberInput(s: string | null | undefined): string | null {
  const t = String(s ?? "").trim();
  if (!t) return null;
  const v = parseMemberNumberCell(t);
  if (v == null) return null;
  return formatMemberNumber(v, "");
}

export function memberNumberRangeError(): string {
  return `会員番号は ${formatMemberNumber(1, "")}〜${formatMemberNumber(MEMBER_NUMBER_MAX, "")} の4桁です。`;
}
