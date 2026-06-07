import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { normalizeBaseUrl } from "@/lib/utils";

/**
 * パスワード再設定・各種メールリンクの着地点（サーバー側）。
 * token_hash を verifyOtp で検証して Cookie にセッションを確立してから、
 * next（既定は /auth/set-password）へリダイレクトする。
 *
 * admin.generateLink が返す action_link（Supabase の verify エンドポイント）には依存せず、
 * properties.hashed_token から自前のこの URL を組み立てて使う。PKCE / URL ハッシュ依存を避け、
 * 「Auth session missing!」を防ぐための恒久対策。
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = (url.searchParams.get("type") ?? "recovery") as EmailOtpType;
  const rawNext = url.searchParams.get("next") ?? "/auth/set-password";
  const next = rawNext.startsWith("/") ? rawNext : "/auth/set-password";

  const base = normalizeBaseUrl(url.origin);

  if (!tokenHash) {
    return NextResponse.redirect(
      new URL(`/mypage?error=${encodeURIComponent("リンクが正しくありません。事務局に再送を依頼してください。")}`, base),
      303
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/mypage?error=${encodeURIComponent("リンクの有効期限が切れているか、既に使用されています。事務局にパスワード再設定メールの再送を依頼してください。")}`,
        base
      ),
      303
    );
  }

  return NextResponse.redirect(new URL(next, base), 303);
}
