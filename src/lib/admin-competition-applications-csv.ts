import { young2026CategoryLabel } from "@/lib/young-2026-apply-confirm";
import {
  young2026PieceFinalCsvHeader,
  young2026PiecePreliminaryCsvHeader,
} from "@/lib/young-2026-piece-field-labels";
import { YOUNG_2026 } from "@/lib/young-2026";

export type CompetitionApplicationCsvRow = Record<string, string>;

const PIECE_PRE_CSV = young2026PiecePreliminaryCsvHeader();
const PIECE_FIN_CSV = young2026PieceFinalCsvHeader();

const HEADERS = [
  "申込ID",
  "申込日時",
  "氏名",
  "ふりがな",
  "メール",
  "生年月日",
  "基準日時点の満年齢",
  "会員種別",
  "会員番号",
  "部門",
  PIECE_PRE_CSV,
  PIECE_FIN_CSV,
  "予選動画URL",
  "伴奏備考",
  "参加費円",
  "決済状況",
  "支払経路",
  "入金日時",
  "振込証明画像",
  "紐付け会員profile_id",
] as const;

function csvEscape(v: string): string {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

function str(v: unknown): string {
  if (v == null) return "";
  return typeof v === "string" ? v : String(v);
}

function categoryLabelForSlug(slug: string, categoryId: string): string {
  if (slug === YOUNG_2026.slug) return young2026CategoryLabel(categoryId);
  return categoryId;
}

function paymentRouteLabel(v: unknown): string {
  const s = str(v).trim();
  if (s === "bank_transfer") return "銀行振込・郵便振替";
  if (s === "stripe_card") return "クレジットカード";
  return s || "—";
}

function paymentStatusLabel(v: unknown): string {
  const s = str(v).trim();
  if (s === "paid") return "入金済";
  if (s === "pending") return "未入金";
  if (s === "cancelled") return "キャンセル";
  if (s === "refunded") return "返金";
  return s || "—";
}

function hasReceipt(v: unknown): string {
  const s = str(v).trim();
  return s ? "あり" : "なし";
}

function formatIsoJa(iso: string): string {
  const t = iso.trim();
  if (!t) return "";
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return t;
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function applicationRecordToCsvRow(
  row: Record<string, unknown>,
  competitionSlug: string
): CompetitionApplicationCsvRow {
  const amount = row.amount;
  const amountStr =
    typeof amount === "number" && Number.isFinite(amount) ? String(amount) : str(amount);

  const age = row.age_at_reference;
  const ageStr =
    typeof age === "number" && Number.isFinite(age) ? String(age) : str(age);

  return {
    申込ID: str(row.id),
    申込日時: formatIsoJa(str(row.created_at)),
    氏名: str(row.name),
    ふりがな: str(row.furigana),
    メール: str(row.email),
    生年月日: str(row.birth_date).slice(0, 10),
    基準日時点の満年齢: ageStr,
    会員種別: str(row.member_type),
    会員番号: str(row.member_number),
    部門: categoryLabelForSlug(competitionSlug, str(row.category)),
    [PIECE_PRE_CSV]: str(row.selected_piece_preliminary),
    [PIECE_FIN_CSV]: str(row.selected_piece_final),
    予選動画URL: str(row.video_url),
    伴奏備考: str(row.accompanist_info),
    参加費円: amountStr,
    決済状況: paymentStatusLabel(row.payment_status),
    支払経路: paymentRouteLabel(row.payment_route),
    入金日時: row.payment_date ? formatIsoJa(str(row.payment_date)) : "",
    振込証明画像: hasReceipt(row.transfer_receipt_path),
    紐付け会員profile_id: str(row.profile_id),
  };
}

export function buildCompetitionApplicationsCsvContent(
  rows: Record<string, unknown>[],
  competitionSlug: string
): string {
  const headers = [...HEADERS];
  const escape = csvEscape;
  const dataRows = rows.map((r) => applicationRecordToCsvRow(r, competitionSlug));
  return [
    headers.join(","),
    ...dataRows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(",")),
  ].join("\r\n");
}
