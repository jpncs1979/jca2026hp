import { NextResponse, type NextRequest } from "next/server";

// realm は HTTP ヘッダー用のため ASCII のみ（日本語だと Edge で 500 になる）
const REALM = "JCA Site";

/** 準備中モード時、常にパスワード不要で開くパス（アンコン・ヤング） */
const BUILTIN_PUBLIC_PATH_PREFIXES = [
  "/events/ensemble",
  "/events/young-2026",
] as const;

function unauthorized(message: string, challenge: boolean) {
  const headers: Record<string, string> = {
    "Content-Type": "text/plain; charset=utf-8",
  };
  if (challenge) {
    headers["WWW-Authenticate"] = `Basic realm="${REALM}"`;
  }
  return new NextResponse(message, { status: 401, headers });
}

/** プリフェッチ・RSC など。401 でも WWW-Authenticate を付けない（ブラウザの認証ポップアップを出さない） */
function isSubresourceRequest(request: NextRequest): boolean {
  if (request.headers.get("next-router-prefetch") === "1") return true;
  if (request.headers.get("rsc") === "1") return true;

  const purpose =
    request.headers.get("purpose") ?? request.headers.get("sec-purpose") ?? "";
  if (purpose.toLowerCase().includes("prefetch")) return true;

  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/x-component")) return true;

  const secFetchDest = request.headers.get("sec-fetch-dest") ?? "";
  if (secFetchDest && secFetchDest !== "document") return true;

  const secFetchMode = request.headers.get("sec-fetch-mode") ?? "";
  if (secFetchMode === "cors" || secFetchMode === "no-cors") return true;

  return false;
}

function denyAccess(request: NextRequest, message: string) {
  return unauthorized(message, !isSubresourceRequest(request));
}

/** パス比較用（末尾スラッシュを除く。ルートは `/` のまま） */
export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed || "/";
}

function parsePathSegment(segment: string): string | null {
  let s = segment.trim().replace(/^["']|["']$/g, "");
  if (!s) return null;

  if (s.includes("://")) {
    try {
      s = new URL(s).pathname;
    } catch {
      return null;
    }
  }

  if (!s.startsWith("/")) {
    s = `/${s}`;
  }

  return normalizePathname(s);
}

/** `SITE_ACCESS_PUBLIC_PATHS`（カンマ区切り）をパス配列に変換 */
export function parseSiteAccessPublicPaths(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,\n]/)
    .map((s) => parsePathSegment(s))
    .filter((p): p is string => p != null && p.length > 0);
}

/** ビルトイン + 環境変数の公開パス一覧 */
export function getEffectivePublicPaths(): string[] {
  const fromEnv = parseSiteAccessPublicPaths(
    process.env.SITE_ACCESS_PUBLIC_PATHS
  );
  const merged = [...BUILTIN_PUBLIC_PATH_PREFIXES, ...fromEnv].map(
    normalizePathname
  );
  return [...new Set(merged)];
}

/** 指定パスが公開ホワイトリストに含まれるか（前方一致） */
export function isSiteAccessPublicPath(
  pathname: string,
  publicPaths: string[]
): boolean {
  if (publicPaths.length === 0) return false;
  const path = normalizePathname(pathname);
  return publicPaths.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

/**
 * 環境変数 SITE_ACCESS_PASSWORD が設定されているとき、
 * サイト全体（ページ）に Basic 認証をかける。未設定なら何もしない。
 *
 * アンコン・ヤング（/events/ensemble, /events/young-2026）は常に認証スキップ。
 * SITE_ACCESS_PUBLIC_PATHS で追加の公開パスを指定できる。
 * API（/api/*）は proxy の matcher 外のため Stripe Webhook・Cron は影響しない。
 */
export function siteAccessGateResponse(
  request: NextRequest
): NextResponse | null {
  const password = process.env.SITE_ACCESS_PASSWORD?.trim();
  if (!password) return null;

  const publicPaths = getEffectivePublicPaths();
  if (isSiteAccessPublicPath(request.nextUrl.pathname, publicPaths)) {
    return null;
  }

  const expectedUser = (process.env.SITE_ACCESS_USER ?? "jca").trim();
  const auth = request.headers.get("authorization");

  if (!auth?.startsWith("Basic ")) {
    return denyAccess(
      request,
      "このサイトは準備中です。ブラウザの認証ダイアログでパスワードを入力してください。"
    );
  }

  try {
    const decoded = atob(auth.slice(6));
    const colon = decoded.indexOf(":");
    const user = colon >= 0 ? decoded.slice(0, colon) : decoded;
    const pass = colon >= 0 ? decoded.slice(colon + 1) : "";
    if (user === expectedUser && pass === password) return null;
  } catch {
    // invalid encoding
  }

  return denyAccess(
    request,
    "ユーザー名またはパスワードが正しくありません。"
  );
}
