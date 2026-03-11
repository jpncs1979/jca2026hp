"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * パスワード再設定メールのリンクで、/auth/callback 以外のページに飛んだ場合に
 * /auth/set-password へ転送する。Supabase の Redirect URL が Site URL のみのときなどに有効。
 */
export function RecoveryRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = pathname ?? window.location.pathname;
    if (path === "/auth/callback" || path === "/auth/set-password") return;

    const hash = window.location.hash;
    if (hash && (hash.includes("type=recovery") || hash.includes("access_token"))) {
      window.location.replace(`/auth/set-password${hash}`);
    }
  }, [pathname]);

  return null;
}
