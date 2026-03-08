"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * パスワード再設定メールのリンクから遷移した先。
 * 新しいパスワードを2回入力して設定し、完了後にマイページへ誘導する。
 */
export default function SetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setChecking(false);
      router.replace("/mypage");
      return;
    }
    const hasHash = typeof window !== "undefined" && !!window.location.hash;
    const checkSession = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setChecking(false);
          setReady(true);
        } else if (!hasHash) {
          setChecking(false);
          router.replace("/mypage");
        }
      });
    };
    checkSession();
    if (hasHash) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "INITIAL_SESSION" || event === "PASSWORD_RECOVERY") {
          setChecking(false);
          setReady(true);
        }
      });
      const t = setTimeout(() => checkSession(), 2500);
      return () => {
        clearTimeout(t);
        subscription?.unsubscribe();
      };
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください。");
      return;
    }
    if (password !== passwordConfirm) {
      setError("パスワードが一致しません。");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    if (!supabase) {
      setError("エラーが発生しました。");
      setLoading(false);
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.warn("refreshSession after password update:", refreshError);
    }
    await supabase.auth.signOut();
    setLoading(false);
    setDone(true);
  };

  if (checking) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center p-6">
        <p className="text-muted-foreground">確認しています...</p>
      </div>
    );
  }

  if (!ready) {
    return null;
  }

  if (done) {
    return (
      <div className="container mx-auto max-w-md px-4 py-12">
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-lg text-green-800">パスワードを変更しました</CardTitle>
            <CardDescription className="space-y-2">
              <span className="block">新しいパスワードで、会員マイページに改めてログインしてください。</span>
              <span className="block text-sm text-amber-800">
                ログインできない場合は、リンクの有効期限切れの可能性があります。事務局にパスワード再設定メールの再送を依頼してください。
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-gold text-gold-foreground hover:bg-gold-muted">
              <Link href="/mypage">会員マイページでログイン</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-12">
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="text-lg">パスワードの再設定</CardTitle>
          <CardDescription className="space-y-1">
            <span className="block">パスワード再設定用のページです。</span>
            <span className="block">新しいパスワードを設定したあと、会員マイページで改めてログインしてください。</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="rounded-lg bg-destructive/10 p-2 text-sm text-destructive">{error}</p>
            )}
            <div>
              <Label htmlFor="new-password">新しいパスワード（6文字以上）</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className="mt-1"
                autoComplete="new-password"
              />
            </div>
            <div>
              <Label htmlFor="new-password-confirm">パスワード（確認）</Label>
              <Input
                id="new-password-confirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                minLength={6}
                placeholder="同じパスワードを再入力"
                className="mt-1"
                autoComplete="new-password"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={loading}
                className="bg-gold text-gold-foreground hover:bg-gold-muted"
              >
                {loading ? "設定中..." : "パスワードを設定する"}
              </Button>
              <Button type="button" variant="ghost" asChild>
                <Link href="/mypage">マイページへ戻る</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
