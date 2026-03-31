import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
function logoutCleanupHtml(mypagePath: string) {
  // 相対パスで遷移（本番ドメイン・localhost どちらでも有効）
  const safePath = mypagePath.startsWith("/") ? mypagePath : "/mypage";
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"/><title>ログアウト</title></head><body>
<script>
(function () {
  try {
    var keys = Object.keys(localStorage);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (k.indexOf("sb-") === 0) localStorage.removeItem(k);
    }
  } catch (e) {}
  location.replace(${JSON.stringify(safePath)});
})();
</script>
<noscript><p><a href="${safePath}">会員マイページへ</a></p></noscript>
</body></html>`;
}

export async function POST() {
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

  await supabase.auth.signOut();

  const html = logoutCleanupHtml("/mypage");
  const res = new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // キャッシュさせない
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });

  // リダイレクトではなく 200 + HTML にすることで、Set-Cookie と本文が同一レスポンスになり、
  // 続く script で localStorage（sb-*）を掃除してから /mypage へ遷移する（会員マイページ向け）
  return res;
}
