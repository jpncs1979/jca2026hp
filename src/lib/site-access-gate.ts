import { NextResponse, type NextRequest } from "next/server";

// realm は HTTP ヘッダー用のため ASCII のみ（日本語だと Edge で 500 になる）
const REALM = "JCA Site";

function unauthorized(message: string) {
  return new NextResponse(message, {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}"`,
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

/** パス比較用（末尾スラッシュを除く。ルートは `/` のまま） */
export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed || "/";
}

/** `SITE_ACCESS_PUBLIC_PATHS`（カンマ区切り）をパス配列に変換 */
export function parseSiteAccessPublicPaths(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => normalizePathname(s.trim()))
    .filter((p) => p.length > 0);
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
 * SITE_ACCESS_PUBLIC_PATHS に列挙したパス（とその配下）は認証をスキップする。
 * API（/api/*）は proxy の matcher 外のため Stripe Webhook・Cron は影響しない。
 */
export function siteAccessGateResponse(
  request: NextRequest
): NextResponse | null {
  const password = process.env.SITE_ACCESS_PASSWORD?.trim();
  if (!password) return null;

  const publicPaths = parseSiteAccessPublicPaths(
    process.env.SITE_ACCESS_PUBLIC_PATHS
  );
  if (isSiteAccessPublicPath(request.nextUrl.pathname, publicPaths)) {
    return null;
  }

  const expectedUser = (process.env.SITE_ACCESS_USER ?? "jca").trim();
  const auth = request.headers.get("authorization");

  if (!auth?.startsWith("Basic ")) {
    return unauthorized(
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

  return unauthorized("ユーザー名またはパスワードが正しくありません。");
}
