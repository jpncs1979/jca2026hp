/**
 * 会費の継続支払い経路（profiles.payment_channel）
 * is_css_user は非推奨。未移行環境ではフォールバックする。
 */

export type PaymentChannel = "card" | "other";

export const CSS_PAYMENT_CHANNEL_NOTE = "CSS" as const;

export type ProfilePaymentFields = {
  payment_channel?: string | null;
  payment_channel_note?: string | null;
  is_css_user?: boolean | null;
  stripe_customer_id?: string | null;
};

export function resolvePaymentChannel(p: ProfilePaymentFields): PaymentChannel {
  if (p.payment_channel === "card" || p.payment_channel === "other") {
    return p.payment_channel;
  }
  if (p.is_css_user === false) return "card";
  return "other";
}

/**
 * CSS（口座振替）会員かどうか。
 * 支払い方法は「カード」か「CSS」の2種類のみ。CSS は明示的に CSS と記録された会員だけが該当する。
 */
export function isCssPaymentMember(p: ProfilePaymentFields): boolean {
  return (
    p.payment_channel_note?.trim() === CSS_PAYMENT_CHANNEL_NOTE || p.is_css_user === true
  );
}

/**
 * カード会員かどうか。
 * CSS 以外は全員カード扱い（しくみネット・振込などの旧経路はカードへ統一し、廃止する）。
 */
export function isCardPaymentMember(p: ProfilePaymentFields): boolean {
  return !isCssPaymentMember(p);
}

export function paymentChannelLabel(p: ProfilePaymentFields): string {
  if (isCardPaymentMember(p)) return "クレジットカード";
  if (isCssPaymentMember(p)) return "口座振替（CSS）";
  const note = p.payment_channel_note?.trim();
  return note ? `その他（${note}）` : "その他";
}

/** 編集フォーム用: CSS チェック */
export function profileUsesCssChannel(p: ProfilePaymentFields): boolean {
  if (p.payment_channel === "other") {
    return p.payment_channel_note?.trim() === CSS_PAYMENT_CHANNEL_NOTE;
  }
  return p.is_css_user !== false;
}

/** PATCH 用: CSS オン/オフ → DB 列 */
export function paymentChannelPatchFromCssToggle(useCss: boolean): {
  payment_channel: PaymentChannel;
  payment_channel_note: string | null;
  is_css_user: boolean;
} {
  if (useCss) {
    return {
      payment_channel: "other",
      payment_channel_note: CSS_PAYMENT_CHANNEL_NOTE,
      is_css_user: true,
    };
  }
  return {
    payment_channel: "card",
    payment_channel_note: null,
    is_css_user: false,
  };
}

/** Excel / CSV 会費支払い区分から profiles 用の経路列 */
export function profileChannelFromFeeImport(opts: {
  is_css_user: boolean;
  payment_method: string;
  import_payment_kind: string;
}): {
  payment_channel: PaymentChannel;
  payment_channel_note: string | null;
  is_css_user: boolean;
} {
  if (opts.is_css_user) return paymentChannelPatchFromCssToggle(true);
  const k = opts.import_payment_kind;
  if (
    opts.payment_method === "stripe" ||
    k === "legacy_credit" ||
    k === "credit_card" ||
    k === "online_stripe_ok" ||
    k === "online_stripe_pending"
  ) {
    return paymentChannelPatchFromCssToggle(false);
  }
  return {
    payment_channel: "other",
    payment_channel_note: k === "css" ? CSS_PAYMENT_CHANNEL_NOTE : k || null,
    is_css_user: false,
  };
}

export function isMembershipCurrentlyValid(profile: {
  status: string;
  membership_valid_until?: string | null;
}): boolean {
  if (profile.status !== "active") return false;
  const until = profile.membership_valid_until?.trim();
  if (!until) return false;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
  return today <= until;
}
