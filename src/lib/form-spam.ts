/** 公開フォームのボット対策。ハニーポットとランダム文字列は成功したように見せて捨てる。 */

const MIN_FILL_MS = 3_000;
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

export type SpamMessages = {
  timing: string;
  turnstile: string;
};

export const SPAM_MESSAGES_JA: SpamMessages = {
  timing:
    "確認のため、ページを開いてから数秒おいて送信してください。うまくいかない場合はページを再読み込みしてください。",
  turnstile:
    "送信を確認できませんでした。ページを再読み込みして、もう一度お試しください。",
};

export type SpamVerdict =
  | { ok: true }
  | { ok: false; silent: true; reason: "honeypot" | "random-token" }
  | { ok: false; silent: false; error: string };

/** 空白も句読点もない、大文字小文字が細かく切り替わる文字列。動作確認ボットの典型。 */
export function looksLikeRandomToken(value: string): boolean {
  const s = value.trim();
  if (s.length < 12 || s.length > 400) return false;
  if (!/^[A-Za-z0-9]+$/.test(s)) return false;
  if (!/[A-Z]/.test(s) || !/[a-z]/.test(s)) return false;
  let transitions = 0;
  for (let i = 1; i < s.length; i++) {
    const prevUpper = s[i - 1] >= "A" && s[i - 1] <= "Z";
    const currUpper = s[i] >= "A" && s[i] <= "Z";
    const prevLower = s[i - 1] >= "a" && s[i - 1] <= "z";
    const currLower = s[i] >= "a" && s[i] <= "z";
    if ((prevUpper && currLower) || (prevLower && currUpper)) transitions++;
  }
  return transitions >= 4;
}

function honeypotFilled(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  return value != null && value !== false;
}

export function assessFormSpam(input: {
  honeypot: unknown;
  startedAt: unknown;
  message: string;
  messages: SpamMessages;
  now?: number;
}): SpamVerdict {
  if (honeypotFilled(input.honeypot)) {
    return { ok: false, silent: true, reason: "honeypot" };
  }
  if (looksLikeRandomToken(input.message)) {
    return { ok: false, silent: true, reason: "random-token" };
  }

  const now = input.now ?? Date.now();
  const startedAt =
    typeof input.startedAt === "number" ? input.startedAt : Number(input.startedAt);
  const elapsed = now - startedAt;
  if (!Number.isFinite(startedAt) || startedAt <= 0 || elapsed < MIN_FILL_MS || elapsed > MAX_AGE_MS) {
    return { ok: false, silent: false, error: input.messages.timing };
  }
  return { ok: true };
}

export async function verifyTurnstile(input: {
  token: unknown;
  remoteIp?: string | null;
  messages: SpamMessages;
}): Promise<SpamVerdict> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return { ok: true };

  const token = typeof input.token === "string" ? input.token.trim() : "";
  if (!token) {
    return { ok: false, silent: false, error: input.messages.turnstile };
  }

  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);
    if (input.remoteIp) body.set("remoteip", input.remoteIp);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(8_000),
    });
    const data = (await res.json()) as { success?: boolean };
    if (!data.success) {
      return { ok: false, silent: false, error: input.messages.turnstile };
    }
    return { ok: true };
  } catch (e) {
    console.error("[form-spam] turnstile verify failed:", e);
    return { ok: false, silent: false, error: input.messages.turnstile };
  }
}

export async function guardPublicForm(input: {
  honeypot: unknown;
  startedAt: unknown;
  message: string;
  turnstileToken: unknown;
  remoteIp?: string | null;
  messages: SpamMessages;
}): Promise<SpamVerdict> {
  const sync = assessFormSpam(input);
  if (!sync.ok) return sync;
  return verifyTurnstile({
    token: input.turnstileToken,
    remoteIp: input.remoteIp,
    messages: input.messages,
  });
}

export function clientIpFrom(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || null;
}
