import type { Young2026ApplicationParsed } from "@/lib/young-2026-create-application";
import { young2026CategoryLabel } from "@/lib/young-2026-apply-confirm";
import {
  young2026PieceFinalLabel,
  young2026PiecePreliminaryLabel,
} from "@/lib/young-2026-piece-field-labels";
import { YOUNG_2026 } from "@/lib/young-2026";

export type Young2026ApplicationMailFields = {
  name: string;
  furigana: string;
  email: string;
  birth_date: string;
  /** コンクール規定の基準日時点の満年齢（DBの age_at_reference と一致） */
  age_at_reference: number | null;
  member_type: string;
  member_number: string;
  category: string;
  selected_piece_preliminary: string | null;
  selected_piece_final: string | null;
  video_url: string | null;
  accompanist_info: string | null;
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatBirthDisplay(iso: string): string {
  if (!iso?.trim()) return "—";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

/** createYoung2026Application と同じ基準日で満年齢を算出（メール用） */
function ageAtYoungReferenceFromBirth(iso: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const birth = new Date(iso + "T12:00:00");
  if (Number.isNaN(birth.getTime())) return null;
  const ref = new Date(YOUNG_2026.referenceDate);
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;
  return age;
}

export function parsedToMailFields(p: Young2026ApplicationParsed): Young2026ApplicationMailFields {
  return {
    name: p.name,
    furigana: p.furigana,
    email: p.email,
    birth_date: p.birth_date,
    age_at_reference: ageAtYoungReferenceFromBirth(p.birth_date),
    member_type: p.member_type,
    member_number: p.member_number ?? "",
    category: p.category,
    selected_piece_preliminary: p.selected_piece_preliminary,
    selected_piece_final: p.selected_piece_final,
    video_url: p.video_url,
    accompanist_info: p.accompanist_info,
  };
}

/** Stripe Webhook 等で取得した applications 行をメール用に正規化 */
export function applicationRowToMailFields(row: Record<string, unknown>): Young2026ApplicationMailFields {
  const str = (k: string): string => {
    const v = row[k];
    if (v == null) return "";
    return typeof v === "string" ? v : String(v);
  };
  const nullStr = (k: string): string | null => {
    const v = row[k];
    if (v == null) return null;
    const s = typeof v === "string" ? v.trim() : String(v).trim();
    return s || null;
  };
  let birthRaw = str("birth_date").trim();
  if (birthRaw.includes("T")) birthRaw = birthRaw.slice(0, 10);

  const ageRaw = row.age_at_reference;
  const ageAtReference =
    typeof ageRaw === "number" && Number.isFinite(ageRaw)
      ? ageRaw
      : ageAtYoungReferenceFromBirth(birthRaw);

  return {
    name: str("name").trim(),
    furigana: str("furigana").trim(),
    email: str("email").trim(),
    birth_date: birthRaw,
    age_at_reference: ageAtReference,
    member_type: str("member_type").trim(),
    member_number: str("member_number").trim(),
    category: str("category").trim(),
    selected_piece_preliminary: nullStr("selected_piece_preliminary"),
    selected_piece_final: nullStr("selected_piece_final"),
    video_url: nullStr("video_url"),
    accompanist_info: nullStr("accompanist_info"),
  };
}

/**
 * メール本文用：お申し込み内容一覧（HTML 断片）
 */
export function buildYoung2026ApplicationDetailsSection(
  app: Young2026ApplicationMailFields,
  opts?: {
    applicationId?: string;
    amountYen?: number | null;
    paymentRouteLabel?: string;
  }
): string {
  const categoryLabel = young2026CategoryLabel(app.category);
  const parts: string[] = [
    `<hr style="margin:1.25em 0" />`,
    `<p style="font-weight:bold;margin-bottom:0.5em">お申し込み内容（ご確認用）</p>`,
    `<ul style="margin:0;padding-left:1.25em;line-height:1.6">`,
  ];

  if (opts?.applicationId) {
    parts.push(`<li>申込ID：${escapeHtml(opts.applicationId)}</li>`);
  }
  if (opts?.amountYen != null && Number.isFinite(opts.amountYen)) {
    parts.push(`<li>参加費：${escapeHtml(opts.amountYen.toLocaleString("ja-JP"))}円</li>`);
  }
  if (opts?.paymentRouteLabel?.trim()) {
    parts.push(`<li>お支払い方法：${escapeHtml(opts.paymentRouteLabel.trim())}</li>`);
  }

  parts.push(
    `<li>お名前：${escapeHtml(app.name)}</li>`,
    `<li>ふりがな：${escapeHtml(app.furigana)}</li>`,
    `<li>メールアドレス：${escapeHtml(app.email)}</li>`,
    `<li>生年月日：${escapeHtml(formatBirthDisplay(app.birth_date))}</li>`
  );

  if (app.age_at_reference != null && Number.isFinite(app.age_at_reference)) {
    const refIso =
      typeof YOUNG_2026.referenceDate === "string"
        ? YOUNG_2026.referenceDate.slice(0, 10)
        : String(YOUNG_2026.referenceDate).slice(0, 10);
    parts.push(
      `<li>基準日（${escapeHtml(formatBirthDisplay(refIso))}）時点の満年齢：${escapeHtml(String(app.age_at_reference))}歳</li>`
    );
  }

  parts.push(`<li>会員種別：${escapeHtml(app.member_type)}</li>`);

  if (app.member_type === "会員" && app.member_number?.trim()) {
    parts.push(`<li>会員番号：${escapeHtml(app.member_number.trim())}</li>`);
  }

  parts.push(`<li>部門：${escapeHtml(categoryLabel)}</li>`);

  if (app.selected_piece_preliminary) {
    const lab = escapeHtml(young2026PiecePreliminaryLabel(app.category));
    parts.push(`<li>${lab}：${escapeHtml(app.selected_piece_preliminary)}</li>`);
  }
  if (app.selected_piece_final) {
    const lab = escapeHtml(young2026PieceFinalLabel(app.category));
    parts.push(`<li>${lab}：${escapeHtml(app.selected_piece_final)}</li>`);
  }
  if (app.video_url) {
    const vu = escapeHtml(app.video_url);
    parts.push(`<li>予選動画URL：<a href="${vu}">${vu}</a></li>`);
  }
  if (app.accompanist_info) {
    const acc = escapeHtml(app.accompanist_info).replace(/\r\n|\n|\r/g, "<br />");
    parts.push(`<li>伴奏・備考：${acc}</li>`);
  }

  parts.push(`</ul>`);
  return parts.join("\n");
}
