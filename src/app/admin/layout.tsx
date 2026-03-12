import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Users, Trophy, LayoutDashboard, LogOut, MessageCircle } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/mypage?redirect=/admin");
  }

  // profiles が存在するか確認し、is_admin をチェック
  let isAdmin = false;
  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();
    isAdmin = profile?.is_admin === true;
  } catch {
    // テーブル未作成 or キー未設定
  }

  if (!isAdmin) {
    redirect("/mypage?admin_denied=1");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 border-b border-border bg-white">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/admin" className="font-semibold text-navy">
            事務局管理
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-navy"
            >
              <LayoutDashboard className="size-4" />
              ダッシュボード
            </Link>
            <Link
              href="/admin/members"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-navy"
            >
              <Users className="size-4" />
              会員管理
            </Link>
            <Link
              href="/admin/competitions"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-navy"
            >
              <Trophy className="size-4" />
              コンクール
            </Link>
            <Link
              href="/admin/consultation"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-navy"
            >
              <MessageCircle className="size-4" />
              相談室
            </Link>
            <Link href="/" className="text-sm text-muted-foreground hover:text-navy">
              サイトへ
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-navy"
              >
                <LogOut className="size-4" />
                ログアウト
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
