import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { normalizeBaseUrl } from "@/lib/utils";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/mypage").trim() || "/mypage";

  if (!email || !password) {
    const base = normalizeBaseUrl(new URL(request.url).origin);
    return NextResponse.redirect(
      new URL(`/mypage?error=${encodeURIComponent("メールアドレスとパスワードを入力してください。")}`, base),
      303
    );
  }

  const requestUrl = new URL(request.url);
  const origin = normalizeBaseUrl(requestUrl.origin);
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, { path: "/", ...options });
            } catch {
              // ignore
            }
          });
        },
      },
    }
  );

  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const msg =
      error.message === "Invalid login credentials"
        ? "メールアドレスまたはパスワードが正しくありません。"
        : error.message === "Email not confirmed"
          ? "メールアドレスがまだ確認されていません。"
          : error.message;
    const base = normalizeBaseUrl(new URL(request.url).origin);
    return NextResponse.redirect(
      new URL(`/mypage?error=${encodeURIComponent(msg)}`, base),
      303
    );
  }

  // 管理者の場合は /admin に直接リダイレクト
  let dest = redirectTo.startsWith("/") ? redirectTo : "/mypage";
  if (authData?.user?.id) {
    try {
      const { createAdminClient } = await import("@/lib/supabase/server");
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("is_admin")
        .eq("user_id", authData.user.id)
        .single();
      if (profile?.is_admin === true) {
        dest = "/admin";
      }
    } catch {
      // 管理者チェック失敗時は通常のリダイレクト先を使用
    }
  }

  // POST→GET に切り替える（307 だと POST が /mypage に再送され 405 になる）
  return NextResponse.redirect(new URL(dest, origin), 303);
}
