import { memberNumberRangeError, normalizeMemberNumberInput } from "@/lib/member-number";

export const PATRONAGE_FLYER_BUCKET = "patronage-flyers";
export const PATRONAGE_FLYER_MAX_BYTES = 4 * 1024 * 1024;

export const PATRONAGE_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "unpublished",
] as const;

export type PatronageConcertStatus = (typeof PATRONAGE_STATUSES)[number];

export type PatronageConcertRow = {
  id: string;
  slug: string;
  applicant_name: string;
  applicant_email: string;
  member_number: string | null;
  concert_title: string;
  event_date: string;
  doors_open: string;
  curtain_time: string;
  venue: string;
  admission: string;
  performers: string;
  program: string;
  organizer: string;
  contact: string;
  consent_destination: string;
  notes: string | null;
  flyer_path: string | null;
  flyer_content_type: string | null;
  flyer_filename: string | null;
  status: PatronageConcertStatus;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export const PATRONAGE_SELECT_COLS =
  "id, slug, applicant_name, applicant_email, member_number, concert_title, event_date, doors_open, curtain_time, venue, admission, performers, program, organizer, contact, consent_destination, notes, flyer_path, flyer_content_type, flyer_filename, status, approved_at, created_at, updated_at";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function formatConcertDateLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  const date = new Date(y, m - 1, d);
  return `${y}年${m}月${d}日（${WEEKDAYS[date.getDay()]}）`;
}

export function todayInTokyo(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
}

export function patronageFlyerHref(id: string, cacheKey?: string | null): string {
  const base = `/api/patronage-concerts/${id}/flyer`;
  if (!cacheKey) return base;
  return `${base}?v=${encodeURIComponent(cacheKey)}`;
}

/** 添付ファイルがあるときだけ呼ぶ。問題なければ null。 */
export function flyerFileError(file: { name: string; size: number; type: string }): string | null {
  if (!file.name || file.size <= 0) {
    return "チラシファイルが空です。";
  }
  if (file.size > PATRONAGE_FLYER_MAX_BYTES) {
    return "チラシは 4MB 以下の PDF または画像にしてください。";
  }
  if (!flyerExtension(file.name, file.type)) {
    return "チラシは PDF・JPEG・PNG のいずれかを添付してください。";
  }
  return null;
}

export function flyerContentType(ext: string, fileType: string): string {
  if (fileType) return fileType;
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

export function isPdfFlyer(contentType: string | null, filename: string | null): boolean {
  if (contentType?.includes("pdf")) return true;
  return (filename ?? "").toLowerCase().endsWith(".pdf");
}

/** 事務局が申請内容を直すときの項目。掲載の前後を問わず更新できる。 */
export type PatronageConcertEdit = {
  applicant_name: string;
  applicant_email: string;
  member_number: string | null;
  concert_title: string;
  event_date: string;
  doors_open: string;
  curtain_time: string;
  venue: string;
  admission: string;
  performers: string;
  program: string;
  organizer: string;
  contact: string;
  notes: string | null;
};

const EDIT_LIMITS: Record<Exclude<keyof PatronageConcertEdit, "member_number" | "notes">, number> & {
  notes: number;
} = {
  applicant_name: 80,
  applicant_email: 200,
  concert_title: 200,
  event_date: 10,
  doors_open: 20,
  curtain_time: 20,
  venue: 200,
  admission: 500,
  performers: 2000,
  program: 4000,
  organizer: 200,
  contact: 1000,
  notes: 2000,
};

const EDIT_LABELS: Record<keyof typeof EDIT_LIMITS, string> = {
  applicant_name: "申請者名",
  applicant_email: "メールアドレス",
  concert_title: "演奏会表題",
  event_date: "期日",
  doors_open: "開場時刻",
  curtain_time: "開演時刻",
  venue: "場所",
  admission: "入場料",
  performers: "出演者",
  program: "曲目",
  organizer: "主催",
  contact: "問い合わせ先",
  notes: "備考",
};

function isRealIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
  );
}

/** 管理画面からの申請内容更新。問題があれば日本語のエラーを返す。 */
export function parsePatronageConcertEdit(
  raw: unknown
): { ok: true; value: PatronageConcertEdit } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "申請内容が不正です。" };
  }
  const src = raw as Record<string, unknown>;
  const text = (key: string) => (typeof src[key] === "string" ? src[key].trim() : "");

  const required = [
    "applicant_name",
    "applicant_email",
    "concert_title",
    "event_date",
    "doors_open",
    "curtain_time",
    "venue",
    "admission",
    "performers",
    "program",
    "organizer",
    "contact",
  ] as const;

  const value = {} as Record<string, string>;
  for (const key of required) {
    const v = text(key);
    if (!v) {
      return { ok: false, error: `${EDIT_LABELS[key]}を入力してください。` };
    }
    if (v.length > EDIT_LIMITS[key]) {
      return { ok: false, error: `${EDIT_LABELS[key]}が長すぎます。` };
    }
    value[key] = v;
  }

  const notes = text("notes");
  if (notes.length > EDIT_LIMITS.notes) {
    return { ok: false, error: "備考が長すぎます。" };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.applicant_email)) {
    return { ok: false, error: "有効なメールアドレスを入力してください。" };
  }
  if (!isRealIsoDate(value.event_date)) {
    return { ok: false, error: "期日はカレンダーから選択してください。" };
  }

  const memberRaw = text("member_number");
  let member_number: string | null = null;
  if (memberRaw) {
    member_number = normalizeMemberNumberInput(memberRaw);
    if (!member_number) {
      return { ok: false, error: memberNumberRangeError() };
    }
  }

  return {
    ok: true,
    value: {
      applicant_name: value.applicant_name,
      applicant_email: value.applicant_email,
      member_number,
      concert_title: value.concert_title,
      event_date: value.event_date,
      doors_open: value.doors_open,
      curtain_time: value.curtain_time,
      venue: value.venue,
      admission: value.admission,
      performers: value.performers,
      program: value.program,
      organizer: value.organizer,
      contact: value.contact,
      notes: notes || null,
    },
  };
}

export function flyerExtension(filename: string, contentType: string): string | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf") || contentType === "application/pdf") return "pdf";
  if (lower.endsWith(".png") || contentType === "image/png") return "png";
  if (lower.endsWith(".webp") || contentType === "image/webp") return "webp";
  if (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    contentType === "image/jpeg"
  ) {
    return "jpg";
  }
  return null;
}
