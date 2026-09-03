import { redirect } from "next/navigation";
import Link from "next/link";
import { requireValidMember } from "@/lib/member-access";
import { BookOpen, IdCard, LogOut } from "lucide-react";

export default async function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireValidMember();

  if (!auth.ok && auth.reason === "unauthenticated") {
    redirect("/mypage?redirect=/members");
  }

  return (
    <div className="font-soft min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 border-b border-border bg-white">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/members" className="font-semibold text-navy">
            会員専用ページ
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/members/bulletins"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-navy"
            >
              <BookOpen className="size-4" />
              会報
            </Link>
            <Link
              href="/mypage"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-navy"
            >
              <IdCard className="size-4" />
              マイページ
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
      <main className="container mx-auto px-4 py-8">
        {auth.ok ? (
          children
        ) : (
          <MembershipNotice reason={auth.reason === "no_profile" ? "no_profile" : "not_valid"} />
        )}
      </main>
    </div>
  );
}

function MembershipNotice({
  reason,
}: {
  reason: "no_profile" | "not_valid";
}) {
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-amber-300 bg-amber-50 p-6 text-amber-900">
      <h1 className="text-lg font-bold">会員資格が確認できません</h1>
      {reason === "no_profile" ? (
        <p className="mt-2 text-sm">
          ログインは確認できましたが、このメールアドレスに紐づく会員情報が見つかりませんでした。
          入会手続きが完了しているか、登録メールアドレスが正しいかをご確認のうえ、
          事務局までお問い合わせください。
        </p>
      ) : (
        <p className="mt-2 text-sm">
          現在、会員資格の有効期限が切れているか、資格情報が未設定です。
          会費のお支払い状況はマイページでご確認いただけます。
          ご不明な点は事務局までお問い合わせください。
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/mypage"
          className="inline-flex h-9 items-center justify-center rounded-lg bg-gold px-4 text-sm font-medium text-gold-foreground hover:bg-gold-muted"
        >
          マイページへ
        </Link>
        <Link
          href="/contact"
          className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-white px-4 text-sm font-medium hover:bg-muted"
        >
          事務局へ問い合わせ
        </Link>
      </div>
    </div>
  );
}
