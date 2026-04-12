/**
 * メール内リンク等に使う「サイトの公開 URL のオリジン」（パスなし・末尾スラッシュなし）。
 * API ルートでは Origin が付かないことがあるため、環境変数・Forwarded・Host を補助に使う。
 * `_client_origin` はフィッシング防止のため、環境変数またはリクエストの Host と一致する場合のみ採用する。
 */

/** 環境変数の `https://ドメイン/サブパス` を `https://ドメイン` に正規化（誤設定で 404 にならないようにする） */
export function parsePublicOrigin(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;
  const raw = input.trim();
  try {
    const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.origin.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function sameOriginStrict(a: string, b: string): boolean {
  try {
    return new URL(a).origin === new URL(b).origin;
  } catch {
    return false;
  }
}

/** www の有無などホストが同一サイトとみなせるか（メール URL と実サイトの食い違い防止） */
function sameSiteLoose(a: string, b: string): boolean {
  try {
    if (sameOriginStrict(a, b)) return true;
    const hostA = new URL(a).hostname.replace(/^www\./i, "");
    const hostB = new URL(b).hostname.replace(/^www\./i, "");
    return hostA === hostB;
  } catch {
    return false;
  }
}

function requestHostHints(request: Request): string[] {
  const fwd = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = request.headers.get("host")?.split(",")[0]?.trim();
  return [fwd, host].filter((x): x is string => Boolean(x));
}

function urlHostMatchesHints(url: URL, hints: string[]): boolean {
  const ch = url.host;
  const cn = url.hostname;
  for (const h of hints) {
    if (h === ch || h.split(":")[0] === cn) return true;
  }
  return false;
}

export function resolvePublicSiteOrigin(
  request: Request,
  clientOrigin?: string | null
): string {
  const hints = requestHostHints(request);
  const fromEnv = parsePublicOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? undefined);
  const fromClient = parsePublicOrigin(clientOrigin ?? undefined);

  if (fromClient) {
    try {
      const u = new URL(fromClient);
      // 本番ドメインと同一ホスト（www の差のみ等）なら、申込時に使ったオリジンをメールにも使う
      if (fromEnv && sameSiteLoose(fromClient, fromEnv)) return fromClient;
      if (!fromEnv && urlHostMatchesHints(u, hints)) return fromClient;
    } catch {
      /* ignore */
    }
  }

  if (fromEnv) return fromEnv;

  const fromOrigin = parsePublicOrigin(request.headers.get("origin"));
  if (fromOrigin) return fromOrigin;

  const fwdHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const fwdProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (fwdHost && !fwdHost.includes("localhost")) {
    const proto = fwdProto && /^https?$/i.test(fwdProto) ? fwdProto.toLowerCase() : "https";
    return `${proto}://${fwdHost}`.replace(/\/$/, "");
  }

  const host = request.headers.get("host")?.split(",")[0]?.trim();
  if (host && !host.includes("localhost")) {
    return `https://${host}`.replace(/\/$/, "");
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel && !vercel.includes("localhost")) {
    const o = parsePublicOrigin(`https://${vercel}`);
    if (o) return o;
  }

  return "http://localhost:3000";
}
