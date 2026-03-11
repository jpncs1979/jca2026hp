"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Supabase のメールリンク（パスワード再設定・マジックリンク等）からのリダイレクト先。
 * ハッシュで渡されたトークンを処理したあと、next パラメータまたは /mypage へ転送する。
 */
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "redirecting" | "error">("loading");
  const redirected = useRef(false);

  const doRedirect = (path: string) => {
    if (redirected.current) return;
    redirected.current = true;
    setStatus("redirecting");
    router.replace(path);
  };

  useEffect(() => {
    const rawNext = searchParams.get("next") ?? "/mypage";
    const next = rawNext.replace(/^https?:\/\/[^/]+/, "").replace(/^\s+|\s+$/g, "") || "/mypage";

    const supabase = createClient();
    if (!supabase) {
      doRedirect(next);
      return;
    }

    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash) {
      const params = new URLSearchParams(hash.replace(/^#/, ""));
      const err = params.get("error_description") || params.get("error");
      if (params.get("error_code") || err) {
        doRedirect(`${next}?error=${encodeURIComponent(err || "認証エラー")}`);
        return;
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "INITIAL_SESSION" || event === "PASSWORD_RECOVERY") {
        doRedirect(next);
      }
    });

    const t = setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          doRedirect(next);
        } else if (!hash) {
          doRedirect(next);
        }
      });
    }, 2000);

    return () => {
      clearTimeout(t);
      subscription?.unsubscribe();
    };
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-6">
      <p className="text-muted-foreground">
        {status === "loading" && "認証を確認しています..."}
        {status === "redirecting" && "マイページへ移動しています..."}
        {status === "error" && "エラーが発生しました。マイページへ移動します。"}
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center p-6"><p className="text-muted-foreground">読み込み中...</p></div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
