"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatMemberNumber } from "@/lib/member-number";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LogIn,
  User,
  CreditCard,
  FileText,
  Video,
  ArrowRight,
  Edit,
  LayoutDashboard,
} from "lucide-react";

export default function MypagePage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">読み込み中...</div>}>
      <MypageContent />
    </Suspense>
  );
}

function MypageContent(): any {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/mypage";
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<{
    id: string;
    member_number?: number | null;
    name?: string | null;
    name_kana?: string | null;
    email?: string | null;
    status?: string | null;
    affiliation?: string | null;
    is_admin?: boolean | null;
    is_css_user?: boolean | null;
    membership_type?: string | null;
    stripe_customer_id?: string | null;
    source?: string | null;
  } | null>(null);
  const [membership, setMembership] = useState<{
    expiry_date: string;
    payment_method?: string | null;
  } | null>(null);
  const [membershipFeeYears, setMembershipFeeYears] = useState<
    Array<{ fiscal_year: number; label: string; status: string }>
  >([]);
  const [applications, setApplications] = useState<
    Array<{
      id: string;
      category: string;
      payment_status: string;
      created_at: string;
      competition?: { name: string };
    }>
  >([]);
  const [contents, setContents] = useState<
    Array<{ id: string; title: string; file_path: string }>
  >([]);
  const [showLogin, setShowLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const adminDenied = searchParams.get("admin_denied") === "1";
  const redirectToAdmin = searchParams.get("redirect") === "/admin";
  const [showPasswordRecoveryForm, setShowPasswordRecoveryForm] = useState(false);
  const [recoveryNewPassword, setRecoveryNewPassword] = useState("");
  const [recoveryNewPasswordConfirm, setRecoveryNewPasswordConfirm] = useState("");
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [switchToCardLoading, setSwitchToCardLoading] = useState(false);
  const [renewCheckoutLoading, setRenewCheckoutLoading] = useState(false);
  const [registerCardLoading, setRegisterCardLoading] = useState(false);

  // API 経由ログイン失敗時のエラー表示
  useEffect(() => {
    const err = searchParams.get("error");
    if (err) {
      const decoded = decodeURIComponent(err);
      if (decoded.toLowerCase().includes("fetch failed")) {
        setAuthError(
          "本番環境で Supabase への接続に失敗しました（fetch failed）。Vercel の環境変数（NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY）が正しく設定されているか、Supabase のプロジェクトが停止していないかご確認ください。問題が続く場合はシークレットウィンドウでお試しください。"
        );
      } else {
        setAuthError(decoded);
      }
    }
  }, [searchParams]);

  // パスワード再設定メールのリンクでマイページに直で飛んだ場合 → パスワード再設定専用ページへ転送
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash && (hash.includes("type=recovery") || hash.includes("access_token"))) {
      window.location.replace(`/auth/set-password${hash}`);
    }
  }, []);

  // パスワード再設定リンクから戻ったときに新しいパスワードを設定するフォームを表示（set-password ページに転送するため、通常はここには来ない）
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setShowPasswordRecoveryForm(true);
    });
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      setUser(u ?? null);
      if (!u) {
        setLoading(false);
        return;
      }

      try {
        // API 経由で RLS を回避し、インポート会員（user_id 未設定）も取得
        const res = await fetch("/api/mypage/data");
        const data = await res.json();
        if (!res.ok) {
          setProfile(null);
          setMembership(null);
          setMembershipFeeYears([]);
          setApplications([]);
          setContents([]);
        } else {
          const prof = data.profile ?? null;
          setProfile(prof);
          setMembership(data.membership ?? null);
          setMembershipFeeYears(data.membership_fee_years ?? []);
          setApplications(data.applications ?? []);
          setContents(data.contents ?? []);

          // 管理者はマイページ不要 → 管理者画面へ直接リダイレクト
          if (prof?.is_admin === true) {
            router.replace("/admin");
            return;
          }
        }
      } catch {
        setProfile(null);
        setMembership(null);
        setMembershipFeeYears([]);
        setApplications([]);
        setContents([]);
      }

      // 管理者チェック（API 経由で RLS を回避・事務局管理ボタン表示用）
      try {
        const res = await fetch("/api/mypage/admin-check");
        const { isAdmin: admin } = await res.json();
        setIsAdmin(admin === true);
      } catch {
        setIsAdmin(false);
      }

      setShowLogin(false);
      setLoading(false);
    });
  }, [router]);

  useEffect(() => {
    if (searchParams.get("fee_paid") !== "1" || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/mypage/data");
        const data = await res.json();
        if (!cancelled && res.ok) {
          setProfile(data.profile ?? null);
          setMembership(data.membership ?? null);
          setMembershipFeeYears(data.membership_fee_years ?? []);
          setApplications(data.applications ?? []);
          setContents(data.contents ?? []);
        }
      } finally {
        if (!cancelled) {
          router.replace("/mypage", { scroll: false });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, router, user]);

  useEffect(() => {
    if (searchParams.get("card_registered") !== "1" || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/mypage/data");
        const data = await res.json();
        if (!cancelled && res.ok) {
          setProfile(data.profile ?? null);
          setMembership(data.membership ?? null);
          setMembershipFeeYears(data.membership_fee_years ?? []);
          setApplications(data.applications ?? []);
          setContents(data.contents ?? []);
        }
      } finally {
        if (!cancelled) {
          router.replace("/mypage", { scroll: false });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, router, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!email.trim() || !password) {
      setAuthError("メールアドレスとパスワードを入力してください。");
      return;
    }
    setAuthLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) {
        setAuthError("認証の準備ができていません。.env.local に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されているか確認し、開発サーバーを再起動してください。");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const msg =
          error.message === "Invalid login credentials"
            ? "メールアドレスまたはパスワードが正しくありません。Supabase の Authentication → Users にユーザーが存在するか確認し、「Add user」で作成する場合は「Auto Confirm User」にチェックしてください。"
            : error.message === "Email not confirmed"
              ? "メールアドレスがまだ確認されていません。確認メールのリンクをクリックするか、Supabase ダッシュボードで「Auto Confirm User」を有効にしてユーザーを作り直してください。"
              : error.message;
        setAuthError(msg);
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ログイン処理中にエラーが発生しました。";
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRecoveryPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    if (recoveryNewPassword.length < 6) {
      setRecoveryError("パスワードは6文字以上で入力してください。");
      return;
    }
    if (recoveryNewPassword !== recoveryNewPasswordConfirm) {
      setRecoveryError("パスワードが一致しません。");
      return;
    }
    setRecoveryLoading(true);
    const supabase = createClient();
    if (!supabase) {
      setRecoveryError("エラーが発生しました。");
      setRecoveryLoading(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: recoveryNewPassword });
    setRecoveryLoading(false);
    if (error) {
      setRecoveryError(error.message);
      return;
    }
    setShowPasswordRecoveryForm(false);
    setRecoveryNewPassword("");
    setRecoveryNewPasswordConfirm("");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="font-soft">
        <div className="border-b border-border bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold text-navy md:text-4xl">会員マイページ</h1>
          </div>
        </div>
        <div className="container mx-auto px-4 py-12">
          <p className="text-center text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (showLogin && !user) {
    return (
      <div className="font-soft">
        <div className="border-b border-border bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold text-navy md:text-4xl">会員マイページ</h1>
            <p className="mt-2 text-muted-foreground">会員専用の各種サービスをご利用いただけます</p>
            {redirectToAdmin && !adminDenied && (
              <div className="mt-4 rounded-lg border border-navy/20 bg-navy/5 p-4 text-sm text-navy">
                <p className="font-medium">事務局ダッシュボード（/admin）にアクセスするには、ログインが必要です。</p>
                <p className="mt-1 text-muted-foreground">下のフォームでログインすると、事務局権限があればダッシュボードへ進めます。</p>
              </div>
            )}
            {adminDenied && (
              <div className="mt-4 rounded-lg border border-amber-500/50 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-medium">事務局ダッシュボード（/admin）にアクセスできませんでした。</p>
                <p className="mt-2">以下を確認してください：</p>
                <ol className="mt-1 list-inside list-decimal space-y-1">
                  <li><strong>SUPABASE_SERVICE_ROLE_KEY</strong> が .env.local に設定されているか（Supabase ダッシュボード → Project Settings → API の「service_role」）</li>
                  <li>profiles テーブルで is_admin = true に更新したか（セットアップ手順の SQL を実行）</li>
                  <li>開発サーバーを再起動したか（環境変数変更後）</li>
                </ol>
              </div>
            )}
          </div>
        </div>
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto max-w-md">
            <Card>
              <CardHeader>
                <LogIn className="size-10 text-gold" />
                <CardTitle>ログイン</CardTitle>
                <CardDescription>
                  {redirectToAdmin
                    ? "事務局ダッシュボード（/admin）に進むには、ログインしてください。"
                    : "会員マイページをご利用になるには、ログインが必要です。入会手続き完了後はパスワード設定のご案内が表示されます。既に入会済みでパスワード未設定の方はお問い合わせください。"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {adminDenied && (
                  <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-50 p-4 text-sm text-amber-900">
                    <p className="font-medium">事務局ダッシュボード（/admin）にアクセスできませんでした。</p>
                    <p className="mt-2">以下を確認してください：</p>
                    <ol className="mt-1 list-inside list-decimal space-y-1">
                      <li><strong>SUPABASE_SERVICE_ROLE_KEY</strong> が .env.local に設定されているか（必須）</li>
                      <li>Supabase で profiles テーブルの該当ユーザーに <code className="rounded bg-amber-100 px-1">is_admin = true</code> を設定したか</li>
                    </ol>
                    <p className="mt-2 text-xs">詳細は docs/会員システム・管理画面セットアップ.md を参照してください。</p>
                  </div>
                )}
                <>
                  <form
                    action="/api/auth/login"
                    method="POST"
                    className="space-y-4"
                  >
                    <input type="hidden" name="redirect" value={redirectTo} />
                    {authError && (
                      <div className="space-y-2">
                        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{authError}</p>
                        <p className="text-sm text-muted-foreground">
                          <button
                            type="button"
                            onClick={() => {
                              setAuthError(null);
                              router.replace("/mypage");
                            }}
                            className="text-gold hover:underline"
                          >
                            エラーを消してもう一度試す
                          </button>
                        </p>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="email">メールアドレス</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@email.com"
                        autoComplete="email"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">パスワード</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="パスワードを入力"
                        autoComplete="current-password"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <button
                        type="submit"
                        disabled={authLoading}
                        className="inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-lg bg-gold px-4 text-sm font-medium text-gold-foreground transition-colors hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {authLoading ? "ログイン中..." : "ログイン"}
                      </button>
                    </div>
                  </form>
                  <p className="mt-4 text-center text-sm text-muted-foreground">
                    パスワードをお忘れの方は
                    <Link href="/contact" className="text-gold hover:underline">お問い合わせ</Link>
                    ください。
                  </p>
                </>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-navy md:text-3xl">会員マイページ</h1>
          <p className="mt-1 text-muted-foreground">
            {profile?.name || user?.email || "会員"} 様
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mx-auto max-w-2xl space-y-6">
          {showPasswordRecoveryForm && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader>
                <CardTitle className="text-lg">新しいパスワードを設定してください</CardTitle>
                <CardDescription>
                  パスワード再設定のリンクからお越しいただきました。本人確認のため、新しいパスワードを2回入力して設定してください。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRecoveryPasswordSubmit} className="space-y-4">
                  {recoveryError && (
                    <p className="rounded-lg bg-destructive/10 p-2 text-sm text-destructive">{recoveryError}</p>
                  )}
                  <div>
                    <Label htmlFor="recovery-password">新しいパスワード（6文字以上）</Label>
                    <Input
                      id="recovery-password"
                      type="password"
                      value={recoveryNewPassword}
                      onChange={(e) => setRecoveryNewPassword(e.target.value)}
                      minLength={6}
                      className="mt-1"
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recovery-password-confirm">パスワード（確認）</Label>
                    <Input
                      id="recovery-password-confirm"
                      type="password"
                      value={recoveryNewPasswordConfirm}
                      onChange={(e) => setRecoveryNewPasswordConfirm(e.target.value)}
                      minLength={6}
                      placeholder="同じパスワードを再入力"
                      className="mt-1"
                      autoComplete="new-password"
                    />
                  </div>
                  <Button type="submit" disabled={recoveryLoading} className="bg-gold text-gold-foreground hover:bg-gold-muted">
                    {recoveryLoading ? "設定中..." : "パスワードを設定する"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
          {adminDenied && (
            <div className="rounded-lg border border-amber-500/50 bg-amber-50 p-4 text-amber-900">
              <p className="font-medium">事務局ダッシュボード（/admin）にアクセスできませんでした。</p>
              <p className="mt-2 text-sm">以下を確認してください：</p>
              <ul className="mt-1 list-inside list-disc text-sm">
                <li><strong>SUPABASE_SERVICE_ROLE_KEY</strong> が .env.local に設定されているか</li>
                <li>Supabase の profiles テーブルで、あなたのメールアドレスの <strong>is_admin</strong> が true か</li>
              </ul>
              <p className="mt-2 text-sm">詳しくはセットアップ手順書（docs/会員システム・管理画面セットアップ.md）を参照してください。</p>
            </div>
          )}
          {/* デジタル会員証 */}
          <Card className="overflow-hidden border-gold/30 bg-gradient-to-br from-navy to-navy/95 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-gold">
                <CreditCard className="size-5" />
                会員証
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-bold">{profile?.name || "—"}</p>
              <p className="text-sm text-white/80">
                会員番号: {formatMemberNumber(profile?.member_number, "—")}
              </p>
              <p className="text-sm text-white/80">
                会員資格の末日:{" "}
                {membership?.expiry_date ? new Date(membership.expiry_date).toLocaleDateString("ja-JP") : "—"}
              </p>
              <p className="text-xs text-white/60">
                会員資格は各年4月1日から翌年3月31日まで（表示はその期間の末日）
              </p>
              <span
                className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                  profile?.status === "active" ? "bg-gold/30 text-gold" : "bg-white/20"
                }`}
              >
                {profile?.status === "active" ? "有効" : profile?.status === "pending" ? "承認待ち" : "期限切れ"}
              </span>
              {!profile && (
                <p className="text-xs text-white/60">会員情報を取得できませんでした。お手数ですが事務局へご連絡ください。</p>
              )}
              {profile && profile.member_number == null && (
                <p className="text-xs text-white/60">会員番号は事務局承認後に付与されます。</p>
              )}
              {profile && profile.is_css_user !== true && (
                <div className="mt-3 border-t border-white/15 pt-3">
                  <p className="text-xs text-white/70">年会費の自動決済（Stripe）</p>
                  {typeof profile.stripe_customer_id === "string" &&
                  profile.stripe_customer_id.trim() !== "" ? (
                    <p className="mt-1 text-sm text-emerald-200">
                      クレジットカードは登録済みです（毎年1月頃の年会費の自動引き落としに利用します）。
                    </p>
                  ) : (
                    <>
                      <p className="mt-1 text-sm text-amber-100">
                        {membership?.payment_method === "stripe"
                          ? "サイト移行のため、新しいカードの登録が必要です（旧システムのカード情報は引き継がれません）。"
                          : "年会費をクレジットでお支払いする場合や、自動引き落とし用にカードを登録できます。"}
                      </p>
                      <p className="mt-1 text-xs text-white/60">
                        登録は決済を伴いません。Stripe の安全な画面でカード番号を入力してください。
                      </p>
                      <Button
                        type="button"
                        className="mt-2 bg-white text-navy hover:bg-white/90"
                        disabled={registerCardLoading}
                        onClick={async () => {
                          setRegisterCardLoading(true);
                          try {
                            const res = await fetch("/api/mypage/register-card/checkout", {
                              method: "POST",
                              credentials: "include",
                            });
                            const data = await res.json().catch(() => ({}));
                            if (res.ok && data.url) {
                              window.location.href = data.url as string;
                            } else {
                              alert((data as { error?: string }).error ?? "登録画面の開始に失敗しました");
                            }
                          } finally {
                            setRegisterCardLoading(false);
                          }
                        }}
                      >
                        {registerCardLoading ? "処理中..." : "クレジットカードを登録する"}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {profile && profile.status !== "pending" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="size-5 text-gold" />
                  会費支払い状況（直近3年度）
                </CardTitle>
                <CardDescription>
                  会費の「事業年度」は2月1日〜翌年1月31日です（表示の〇〇年度はこれに基づきます）。一方、会員資格は4月1日から翌年3月31日までです。1月までに翌事業年度分の会費が入金されると、会員資格はその次の4月1日から始まる年度に更新されます。
                  マイページからのクレジット決済が完了すると「決済済み」に更新されます（反映まで数秒かかる場合があります）。
                  クレジット会員は、毎年1月22日（日本時間）頃に翌事業年度会費の自動引き落としが行われます（Stripe の入金タイミングに合わせた設定です）。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="divide-y divide-border rounded-lg border border-border text-sm">
                  {membershipFeeYears.map((row) => (
                    <li
                      key={row.fiscal_year}
                      className="flex items-center justify-between gap-2 px-3 py-2.5"
                    >
                      <span className="font-medium">{row.label}</span>
                      <span
                        className={
                          row.status === "未払い"
                            ? "rounded bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-900"
                            : row.status === "決済済み"
                              ? "rounded bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-800"
                              : "rounded bg-navy/10 px-2 py-0.5 text-xs font-medium text-navy"
                        }
                      >
                        {row.status}
                      </span>
                    </li>
                  ))}
                </ul>
                {profile.is_css_user !== true &&
                  membershipFeeYears.some((r) => r.status === "未払い") && (
                    <Button
                      className="bg-gold text-gold-foreground hover:bg-gold-muted"
                      disabled={renewCheckoutLoading}
                      onClick={async () => {
                        setRenewCheckoutLoading(true);
                        try {
                          const res = await fetch("/api/mypage/membership-renew/checkout", {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({}),
                          });
                          const data = await res.json().catch(() => ({}));
                          if (res.ok && data.url) {
                            window.location.href = data.url as string;
                          } else {
                            alert((data as { error?: string }).error ?? "決済の開始に失敗しました");
                          }
                        } finally {
                          setRenewCheckoutLoading(false);
                        }
                      }}
                    >
                      {renewCheckoutLoading
                        ? "処理中..."
                        : "年会費をクレジットカードで支払う（未納が複数ある場合は古い年度から）"}
                    </Button>
                  )}
                {profile.is_css_user === true && (
                  <p className="text-xs text-muted-foreground">
                    口座振替（CSS）でお支払いの場合は、下の「クレジットカード支払いに切り替える」から切り替え後にカード決済できます。
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {profile?.is_css_user === true && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="size-5 text-gold" />
                  支払方法
                </CardTitle>
                <CardDescription>
                  現在、会費は銀行振込（CSS）でお支払いいただいています。事務局が入金を確認したうえでシステム上「振込済み」として更新します。クレジットに切り替えたあと、マイページから年会費をカード決済すると Stripe に支払方法が保存され、以降は毎年1月頃に自動引き落としの対象になります。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="bg-gold text-gold-foreground hover:bg-gold-muted"
                  disabled={switchToCardLoading}
                  onClick={async () => {
                    setSwitchToCardLoading(true);
                    try {
                      const res = await fetch("/api/mypage/switch-to-card", { method: "POST", credentials: "include" });
                      const data = await res.json().catch(() => ({}));
                      if (res.ok) {
                        setProfile((prev) => (prev ? { ...prev, is_css_user: false } : null));
                      } else {
                        alert(data.error ?? "切り替えに失敗しました");
                      }
                    } finally {
                      setSwitchToCardLoading(false);
                    }
                  }}
                >
                  {switchToCardLoading ? "処理中..." : "クレジットカード支払いに切り替える"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* プロフィール編集 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-5 text-gold" />
                  プロフィール
                </CardTitle>
                <CardDescription>住所・連絡先・所属の変更申請</CardDescription>
              </div>
              <Link href="/mypage/profile">
                <Button variant="outline" size="sm">
                  <Edit className="mr-1 size-4" />
                  編集
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="text-sm">
              <dl className="grid gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">氏名</dt>
                  <dd>{profile?.name}（{profile?.name_kana}）</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">メール</dt>
                  <dd>{profile?.email}</dd>
                </div>
                {profile?.affiliation && (
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground">所属</dt>
                    <dd>{profile.affiliation}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* 申込履歴 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5 text-gold" />
                申込履歴
              </CardTitle>
              <CardDescription>イベント等の申し込み状況と決済状態</CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <p className="text-sm text-muted-foreground">申込履歴はありません。</p>
              ) : (
                <ul className="space-y-3">
                  {applications.map((app) => (
                    <li
                      key={app.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
                    >
                      <div>
                        <p className="font-medium">
                          {(app as { competition?: { name: string } }).competition?.name ?? "コンクール"} - {app.category}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(app.created_at).toLocaleDateString("ja-JP")}
                        </p>
                      </div>
                      <span
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          app.payment_status === "paid"
                            ? "bg-green-500/20 text-green-700"
                            : "bg-amber-500/20 text-amber-700"
                        }`}
                      >
                        {app.payment_status === "paid" ? "入金済" : "未入金"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/events" className="mt-4 inline-block text-sm text-gold hover:underline">
                イベント申し込みはこちら
                <ArrowRight className="ml-1 inline size-4" />
              </Link>
            </CardContent>
          </Card>

          {/* 会員限定コンテンツ */}
          {profile?.status === "active" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="size-5 text-gold" />
                  会員限定コンテンツ
                </CardTitle>
                <CardDescription>会報PDF・限定動画など</CardDescription>
              </CardHeader>
              <CardContent>
                {contents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">現在、限定コンテンツはありません。</p>
                ) : (
                  <ul className="space-y-2">
                    {contents.map((c) => (
                      <li key={c.id}>
                        <a
                          href={`/api/member-content/${c.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-gold hover:underline"
                        >
                          {c.title}
                          <ArrowRight className="size-4" />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            {(isAdmin || profile?.is_admin) && (
              <Link href="/admin">
                <Button variant="outline" className="gap-2">
                  <LayoutDashboard className="size-4" />
                  事務局管理
                </Button>
              </Link>
            )}
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
