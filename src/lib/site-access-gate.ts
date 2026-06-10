import { NextResponse, type NextRequest } from "next/server";

const REALM = "日本クラリネット協会（準備中）";

function unauthorized(message: string) {
  return new NextResponse(message, {
    status: 401,
    headers: { "WWW-Authenticate": `Basic realm="${REALM}"` },
  });
}

/**
 * 環境変数 SITE_ACCESS_PASSWORD が設定されているとき、
 * サイト全体（ページ）に Basic 認証をかける。未設定なら何もしない。
 *
 * API（/api/*）は proxy の matcher 外のため Stripe Webhook・Cron は影響しない。
 */
export function siteAccessGateResponse(
  request: NextRequest
): NextResponse | null {
  const password = process.env.SITE_ACCESS_PASSWORD?.trim();
  if (!password) return null;

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
