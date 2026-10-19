import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { OFFICE_FROM_EMAIL } from "@/lib/email";

export const CONSULTATION_CATEGORIES = [
  "音が出ない、どうして？どうしよう",
  "リードはどうしたらよいの？",
  "奏法について（アンブシュア、呼吸）",
  "楽器について",
  "特殊管について",
  "その他",
] as const;

export const CONSULTATION_AGES = ["小学生", "中学生", "高校生"] as const;

export const CONSENT_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const PUBLIC_NAME_MAX = 80;
export const CONSULTATION_TEXT_MAX = 15_000;
export const ANSWER_MAIL_SUBJECT = "【クラリネット相談室】ご質問への回答";

export const OFFICE_CONTACT_NAME = "一般社団法人日本クラリネット協会 事務局";
export const OFFICE_CONTACT_EMAIL = OFFICE_FROM_EMAIL;

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const HASH_PATTERN = /^[0-9a-f]{64}$/i;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function cleanPublicName(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function isConsentTokenShape(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

export function createConsentToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashConsentToken(token) };
}

export function hashConsentToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** 保存済みハッシュと、リンクのトークンから計算したハッシュを比較する。 */
export function consentTokenMatches(storedHash: string, token: string): boolean {
  if (!HASH_PATTERN.test(storedHash) || !isConsentTokenShape(token)) return false;
  const actual = hashConsentToken(token);
  const left = Buffer.from(storedHash, "hex");
  const right = Buffer.from(actual, "hex");
  if (left.length === 0 || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function consentExpiryFrom(now: Date): Date {
  return new Date(now.getTime() + CONSENT_TTL_MS);
}

export function formatJst(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function consentPageUrl(origin: string, token: string): string {
  return `${origin.replace(/\/$/, "")}/consultation/consent/${token}`;
}

export function adminQuestionUrl(origin: string, id: string): string {
  return `${origin.replace(/\/$/, "")}/admin/consultation?id=${encodeURIComponent(id)}`;
}

/** 承諾リンクはサイト直下のパスだけ。クエリや追跡パラメータは付けない。 */
export function assertDirectConsentUrl(url: string, origin: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("承諾リンクが不正です。");
  }
  if (parsed.origin !== origin.replace(/\/$/, "")) {
    throw new Error("承諾リンクのサイトが一致しません。");
  }
  if (parsed.search || parsed.hash) {
    throw new Error("承諾リンクに余分なパラメータがあります。");
  }
  if (!/^\/consultation\/consent\/[A-Za-z0-9_-]{43}$/.test(parsed.pathname)) {
    throw new Error("承諾リンクの形式が不正です。");
  }
}

export type ConsultationStatus =
  | "pending"
  | "answered"
  | "sent"
  | "awaiting_consent"
  | "published"
  | "declined"
  | "unpublished";

export type ConsentRecordStatus = "not_requested" | "requested" | "approved" | "declined";

export type AdminAction = "save_draft" | "send" | "resend" | "unpublish";

export type AdminFieldInput = {
  publicName: string;
  publicQuestion: string;
  answer: string;
};

type AdminSource = {
  publish_wanted: boolean;
  public_name: string | null;
  public_question: string | null;
  answer: string | null;
  status: string;
};

export type AdminWritablePatch = {
  public_name: string | null;
  public_question: string | null;
  answer: string | null;
  status: ConsultationStatus;
  published_at?: string | null;
  answer_sent_at?: string | null;
  consent_status?: ConsentRecordStatus;
  consent_token_hash?: string | null;
  consent_requested_at?: string | null;
  consent_expires_at?: string | null;
};

export type AdminPlan =
  | { ok: false; error: string }
  | { ok: true; email: "none" | "answer_only" | "consent"; patch: AdminWritablePatch };

function norm(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function fieldsChanged(row: AdminSource, input: AdminFieldInput): boolean {
  return (
    norm(row.public_name) !== input.publicName ||
    norm(row.public_question) !== input.publicQuestion ||
    norm(row.answer) !== input.answer
  );
}

function textPatch(input: AdminFieldInput): Pick<
  AdminWritablePatch,
  "public_name" | "public_question" | "answer"
> {
  return {
    public_name: input.publicName || null,
    public_question: input.publicQuestion || null,
    answer: input.answer || null,
  };
}

function lengthError(input: AdminFieldInput): string | null {
  if (input.publicName.length > PUBLIC_NAME_MAX) {
    return `掲載時のお名前は${PUBLIC_NAME_MAX}文字以内にしてください。`;
  }
  if (input.publicQuestion.length > CONSULTATION_TEXT_MAX || input.answer.length > CONSULTATION_TEXT_MAX) {
    return "質問文と回答は15,000文字以内にしてください。";
  }
  return null;
}

function consentPatch(
  input: AdminFieldInput,
  nowIso: string
): { email: "consent"; patch: AdminWritablePatch } {
  return {
    email: "consent",
    patch: {
      ...textPatch(input),
      status: "awaiting_consent",
      published_at: null,
      answer_sent_at: nowIso,
      consent_status: "requested",
    },
  };
}

/**
 * 事務局の操作で、保存内容と送るメールを決める。
 * 承諾後（掲載中・承諾待ち）に公開文面を変えた下書き保存は、掲載を外して承諾メールを送り直す。
 */
export function planConsultationAdminAction(
  row: AdminSource,
  action: AdminAction,
  input: AdminFieldInput,
  nowIso: string
): AdminPlan {
  const tooLong = lengthError(input);
  if (tooLong) return { ok: false, error: tooLong };

  if (action === "unpublish") {
    if (row.status !== "published") {
      return { ok: false, error: "掲載中の質問だけ取り下げできます。" };
    }
    return {
      ok: true,
      email: "none",
      patch: {
        ...textPatch(input),
        status: "unpublished",
        published_at: null,
        consent_token_hash: null,
        consent_requested_at: null,
        consent_expires_at: null,
      },
    };
  }

  if (action === "resend") {
    if (row.status !== "awaiting_consent") {
      return { ok: false, error: "承諾待ちの質問だけ、承諾メールを再送できます。" };
    }
    if (!input.answer) return { ok: false, error: "回答を入力してください。" };
    if (!input.publicName) return { ok: false, error: "掲載時のお名前を入力してください。" };
    return { ok: true, ...consentPatch(input, nowIso) };
  }

  if (action === "send") {
    if (!input.answer) return { ok: false, error: "回答を入力してください。" };
    if (row.publish_wanted) {
      if (!input.publicName) return { ok: false, error: "掲載時のお名前を入力してください。" };
      return { ok: true, ...consentPatch(input, nowIso) };
    }
    return {
      ok: true,
      email: "answer_only",
      patch: {
        ...textPatch(input),
        status: "sent",
        published_at: null,
        answer_sent_at: nowIso,
        consent_status: "not_requested",
        consent_token_hash: null,
        consent_requested_at: null,
        consent_expires_at: null,
      },
    };
  }

  const changed = fieldsChanged(row, input);
  if ((row.status === "published" || row.status === "awaiting_consent") && changed) {
    if (!input.publicName) return { ok: false, error: "掲載時のお名前を入力してください。" };
    if (!input.answer) return { ok: false, error: "回答を入力してください。" };
    return { ok: true, ...consentPatch(input, nowIso) };
  }

  const status: ConsultationStatus =
    row.status === "pending" || row.status === "answered" ? "answered" : (row.status as ConsultationStatus);

  return {
    ok: true,
    email: "none",
    patch: {
      ...textPatch(input),
      status,
    },
  };
}

export type ConsentLookRow = {
  consent_token_hash: string | null;
  consent_status: string;
  consent_expires_at: string | null;
  status: string;
  category: string;
  public_name: string | null;
  age: string | null;
  public_question: string | null;
  answer: string | null;
};

export type ConsentView =
  | { kind: "not_found" }
  | { kind: "expired" }
  | { kind: "used"; consentStatus: "approved" | "declined" | "other" }
  | {
      kind: "ready";
      category: string;
      publicName: string | null;
      age: string | null;
      publicQuestion: string | null;
      answer: string | null;
      expiresAt: string;
    };

export function classifyConsent(
  row: ConsentLookRow | null,
  token: string,
  now: Date
): ConsentView {
  if (!row?.consent_token_hash || !consentTokenMatches(row.consent_token_hash, token)) {
    return { kind: "not_found" };
  }

  if (row.consent_status === "approved" || row.status === "published") {
    return { kind: "used", consentStatus: "approved" };
  }
  if (row.consent_status === "declined" || row.status === "declined") {
    return { kind: "used", consentStatus: "declined" };
  }

  const expiresAt = row.consent_expires_at ? new Date(row.consent_expires_at) : null;
  if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= now.getTime()) {
    return { kind: "expired" };
  }

  if (row.status !== "awaiting_consent" || row.consent_status !== "requested") {
    return { kind: "used", consentStatus: "other" };
  }

  return {
    kind: "ready",
    category: row.category,
    publicName: row.public_name,
    age: row.age,
    publicQuestion: row.public_question,
    answer: row.answer,
    expiresAt: row.consent_expires_at!,
  };
}

function contactText(origin: string): string {
  return [
    OFFICE_CONTACT_NAME,
    `メール: ${OFFICE_CONTACT_EMAIL}`,
    `お問い合わせ: ${origin.replace(/\/$/, "")}/contact`,
  ].join("\n");
}

function contactHtml(origin: string): string {
  const site = origin.replace(/\/$/, "");
  const contactUrl = `${site}/contact`;
  return `<p>${escapeHtml(OFFICE_CONTACT_NAME)}<br>
メール: <a href="mailto:${escapeHtml(OFFICE_CONTACT_EMAIL)}">${escapeHtml(OFFICE_CONTACT_EMAIL)}</a><br>
お問い合わせ: <a href="${escapeHtml(contactUrl)}">${escapeHtml(contactUrl)}</a></p>`;
}

export function buildAnswerMail(input: {
  name: string;
  answer: string;
  publishWanted: boolean;
  publicName: string;
  publicQuestion: string;
  consentUrl: string | null;
  expiresAt: Date | null;
  origin: string;
}): { subject: string; html: string; text: string } {
  if (input.publishWanted) {
    if (!input.consentUrl || !input.expiresAt) {
      throw new Error("承諾リンクがありません。");
    }
    assertDirectConsentUrl(input.consentUrl, input.origin);
  } else if (input.consentUrl) {
    throw new Error("掲載希望がない回答に承諾リンクは付けません。");
  }

  const expiresLabel = input.expiresAt ? formatJst(input.expiresAt) : "";
  const questionText = input.publicQuestion || "（質問の詳細はありません）";
  const parentNote = "小学生・中学生の方は、おうちの方と一緒に確認してください。";

  const publishText = input.publishWanted
    ? [
        "HPには次の内容で掲載する予定です。",
        "",
        `お名前: ${input.publicName}`,
        "質問:",
        questionText,
        "回答:",
        input.answer,
        "",
        "掲載してよいかは、次のページでお選びください。",
        "「掲載してよい」",
        input.consentUrl ?? "",
        "「掲載しない」",
        input.consentUrl ?? "",
        "どちらのリンクも同じ確認ページです。ページのボタンを押すまで、掲載は決まりません。",
        `このリンクは ${expiresLabel} まで有効です。`,
        "お返事がない場合は掲載しません。",
      ].join("\n")
    : "この回答はメールでお送りするものです。HPには掲載しません。";

  const text = [
    `${input.name} 様`,
    "",
    "クラリネット相談室にご質問いただき、ありがとうございます。",
    "回答をお送りします。",
    "",
    "■ 回答",
    input.answer,
    "",
    publishText,
    "",
    parentNote,
    "",
    "ご不明な点は事務局までお問い合わせください。",
    contactText(input.origin),
  ].join("\n");

  const publishHtml = input.publishWanted
    ? `<p>HPには次の内容で掲載する予定です。</p>
<table style="border-collapse:collapse;">
  <tr><td style="vertical-align:top;padding:6px 12px 6px 0;font-weight:600;">お名前</td><td style="padding:6px 0;">${escapeHtml(input.publicName)}</td></tr>
  <tr><td style="vertical-align:top;padding:6px 12px 6px 0;font-weight:600;">質問</td><td style="padding:6px 0;white-space:pre-wrap;">${escapeHtml(questionText)}</td></tr>
  <tr><td style="vertical-align:top;padding:6px 12px 6px 0;font-weight:600;">回答</td><td style="padding:6px 0;white-space:pre-wrap;">${escapeHtml(input.answer)}</td></tr>
</table>
<p>掲載してよいかは、次のページでお選びください（${escapeHtml(expiresLabel)} まで）。</p>
<p><a href="${escapeHtml(input.consentUrl ?? "")}">掲載してよい</a></p>
<p><a href="${escapeHtml(input.consentUrl ?? "")}">掲載しない</a></p>
<p>どちらのリンクも同じ確認ページです。ページのボタンを押すまで、掲載は決まりません。</p>
<p>お返事がない場合は掲載しません。</p>`
    : `<p>この回答はメールでお送りするものです。HPには掲載しません。</p>`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <p>${escapeHtml(input.name)} 様</p>
  <p>クラリネット相談室にご質問いただき、ありがとうございます。<br>回答をお送りします。</p>
  <p style="font-weight:600;">回答</p>
  <p style="white-space:pre-wrap;">${escapeHtml(input.answer)}</p>
  ${publishHtml}
  <p>${escapeHtml(parentNote)}</p>
  <p>ご不明な点は事務局までお問い合わせください。</p>
  ${contactHtml(input.origin)}
</body>
</html>`;

  return { subject: ANSWER_MAIL_SUBJECT, html, text };
}

export function buildOfficeDecisionMail(input: {
  publicName: string;
  decision: "approved" | "declined";
  adminUrl: string;
}): { subject: string; html: string; text: string } {
  const who = input.publicName || "（ハンドルネームなし）";
  const verb = input.decision === "approved" ? "掲載を承諾しました" : "掲載を辞退しました";
  const subject = `【クラリネット相談室】${who}さんが${verb}`;
  const text = [`${who}さんが${verb}。`, "", "事務局画面:", input.adminUrl].join("\n");
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <p>${escapeHtml(who)}さんが${escapeHtml(verb)}。</p>
  <p><a href="${escapeHtml(input.adminUrl)}">事務局画面で確認する</a></p>
</body>
</html>`;
  return { subject, html, text };
}

export function buildOfficeQuestionMail(input: {
  name: string;
  email: string;
  publicName: string;
  publishWanted: boolean;
  age: string;
  category: string;
  questionBody: string;
  answerUrl: string;
}): { subject: string; html: string; text: string } {
  const wanted = input.publishWanted ? "あり" : "なし";
  const handle = input.publicName || "（なし）";
  const detail = input.questionBody || "（なし）";
  const subject = `【クラリネット相談室】${input.category.slice(0, 40)}`;
  const text = [
    "クラリネット相談室に質問が届きました。",
    `事務局画面: ${input.answerUrl}`,
    `氏名: ${input.name}`,
    `メールアドレス: ${input.email}`,
    `掲載希望: ${wanted}`,
    `ハンドルネーム: ${handle}`,
    `年齢: ${input.age}`,
    `内容: ${input.category}`,
    `詳細: ${detail}`,
  ].join("\n");
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <p>クラリネット相談室に質問が届きました。</p>
  <p><a href="${escapeHtml(input.answerUrl)}">事務局画面で回答する</a></p>
  <table style="border-collapse:collapse;">
    <tr><td style="vertical-align:top;padding:6px 12px 6px 0;font-weight:600;">氏名</td><td style="padding:6px 0;">${escapeHtml(input.name)}</td></tr>
    <tr><td style="vertical-align:top;padding:6px 12px 6px 0;font-weight:600;">メールアドレス</td><td style="padding:6px 0;">${escapeHtml(input.email)}</td></tr>
    <tr><td style="vertical-align:top;padding:6px 12px 6px 0;font-weight:600;">掲載希望</td><td style="padding:6px 0;">${escapeHtml(wanted)}</td></tr>
    <tr><td style="vertical-align:top;padding:6px 12px 6px 0;font-weight:600;">ハンドルネーム</td><td style="padding:6px 0;">${escapeHtml(handle)}</td></tr>
    <tr><td style="vertical-align:top;padding:6px 12px 6px 0;font-weight:600;">年齢</td><td style="padding:6px 0;">${escapeHtml(input.age)}</td></tr>
    <tr><td style="vertical-align:top;padding:6px 12px 6px 0;font-weight:600;">内容</td><td style="padding:6px 0;">${escapeHtml(input.category)}</td></tr>
    <tr><td style="vertical-align:top;padding:6px 12px 6px 0;font-weight:600;">詳細</td><td style="padding:6px 0;white-space:pre-wrap;">${escapeHtml(detail)}</td></tr>
  </table>
</body>
</html>`;
  return { subject, html, text };
}
