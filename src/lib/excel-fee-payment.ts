/**
 * Excel「会費支払い方法」列（および CSV 一括の「会費支払い方法」）の正規化。
 *
 * DB: memberships.payment_method + profiles.import_payment_kind
 *
 * 会費支払い方法の取り込み値（旧4種）:
 * - CSS → css
 * - シクミネット → shikuminet
 * - 振込（銀行振込・コンビニ・口座振替系も含む）→ furikomi
 * - 空欄・「ー」「-」→ blank
 *
 * クレジットカード（会費欄にクレジット表記）→ credit_card + payment_method stripe
 *
 * 互換: DB に残る旧値 legacy_credit / other / web_transfer / online_* は一覧側で解釈。
 */

/** profiles.import_payment_kind に保存する値 */
export type ImportPaymentKind =
  | "css"
  | "shikuminet"
  | "furikomi"
  | "blank"
  | "credit_card"
  | "legacy_credit"
  | "other"
  | "web_transfer"
  | "online_stripe_ok"
  | "online_stripe_pending";

export type FeePaymentDb = {
  is_css_user: boolean;
  payment_method: "stripe" | "css" | "transfer";
  import_payment_kind: ImportPaymentKind;
};

function isShikuminetLabel(t: string): boolean {
  const n = t.normalize("NFKC");
  const u = n.toUpperCase();
  return (
    n.includes("シクミネット") ||
    u.includes("SHIKUMINET") ||
    (n.includes("シク") && n.includes("ミネット"))
  );
}

function isFurikomiLabel(t: string, u: string): boolean {
  if (t.includes("振込") || t.includes("振り込み") || t.includes("銀行振込")) return true;
  if (t.includes("コンビニ")) return true;
  if (t.includes("口座振替")) return true;
  if (u.includes("FURIKOMI") || u.includes("TRANSFER")) return true;
  return false;
}

/** 空欄は kind=blank（表示「ー」） */
export function parseFeePaymentLabel(raw: unknown): FeePaymentDb {
  const t0 = String(raw ?? "").trim();
  if (!t0) {
    return {
      is_css_user: false,
      payment_method: "transfer",
      import_payment_kind: "blank",
    };
  }
  const t = t0.normalize("NFKC");
  const u = t.toUpperCase();

  if (u.includes("CSS")) {
    return {
      is_css_user: true,
      payment_method: "css",
      import_payment_kind: "css",
    };
  }
  if (isShikuminetLabel(t)) {
    return {
      is_css_user: false,
      payment_method: "transfer",
      import_payment_kind: "shikuminet",
    };
  }
  if (t === "-" || t === "－" || t === "ー" || t === "―") {
    return {
      is_css_user: false,
      payment_method: "transfer",
      import_payment_kind: "blank",
    };
  }
  if (t.includes("クレジット") || u.includes("CREDIT")) {
    return {
      is_css_user: false,
      payment_method: "stripe",
      import_payment_kind: "credit_card",
    };
  }
  if (t.includes("旧クレジット")) {
    return {
      is_css_user: false,
      payment_method: "stripe",
      import_payment_kind: "legacy_credit",
    };
  }
  if (t.includes("登録済み") && t.includes("クレジット")) {
    return {
      is_css_user: false,
      payment_method: "stripe",
      import_payment_kind: "online_stripe_ok",
    };
  }
  if (
    t.includes("クレジット") &&
    (t.includes("未登録") || t.includes("登録されていない"))
  ) {
    return {
      is_css_user: false,
      payment_method: "stripe",
      import_payment_kind: "online_stripe_pending",
    };
  }
  if (isFurikomiLabel(t, u)) {
    return {
      is_css_user: false,
      payment_method: "transfer",
      import_payment_kind: "furikomi",
    };
  }
  // 一覧 CSV の「ー（空欄）」再取り込み
  if ((t.includes("ー") || t.includes("－")) && t.includes("空欄")) {
    return {
      is_css_user: false,
      payment_method: "transfer",
      import_payment_kind: "blank",
    };
  }
  return {
    is_css_user: false,
    payment_method: "transfer",
    import_payment_kind: "furikomi",
  };
}

/** 管理画面の絞り込み用 query 値 */
export const FEE_PAYMENT_FILTER_KEYS = [
  "fee_css",
  "fee_shikuminet",
  "fee_furikomi",
  "fee_blank",
  "card_registered",
  "card_pending",
] as const;

export type FeePaymentFilterKey = (typeof FEE_PAYMENT_FILTER_KEYS)[number];

/** import_payment_kind から絞り込みキー（Stripe の有無は別途判定が必要） */
export function feePaymentFilterKeyFromKind(kind: ImportPaymentKind): FeePaymentFilterKey {
  if (kind === "css") return "fee_css";
  if (kind === "shikuminet") return "fee_shikuminet";
  if (kind === "furikomi" || kind === "web_transfer" || kind === "other") return "fee_furikomi";
  if (kind === "blank") return "fee_blank";
  return "card_pending";
}

export const FEE_PAYMENT_FILTER_LABELS: Record<FeePaymentFilterKey, string> = {
  fee_css: "CSS",
  fee_shikuminet: "シクミネット",
  fee_furikomi: "振込",
  fee_blank: "ー（空欄）",
  card_registered: "クレジットカード（登録済み）",
  card_pending: "クレジットカード（未登録・マイページから登録可）",
};
