"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";

export function SetPasswordForm({ sessionId }: { sessionId: string }) {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

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
    try {
      const res = await fetch("/api/membership/join/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "設定に失敗しました。");
        setLoading(false);
        return;
      }
      setDone(true);
    } catch {
      setError("通信エラーが発生しました。しばらくしてからお試しください。");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="font-soft">
        <div className="border-b border-border bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold text-navy md:text-4xl">
              パスワードを設定しました
            </h1>
            <p className="mt-2 text-muted-foreground">
              マイページにログインしてご利用いただけます。
            </p>
          </div>
        </div>
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-xl">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  このメールアドレスと、今設定したパスワードでログインしてください。
                </p>
                <div className="mt-6">
                  <Link href="/mypage">
                    <Button className="w-full bg-gold text-gold-foreground hover:bg-gold-muted">
                      マイページへログイン
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-navy md:text-4xl">
            マイページ用パスワードを設定
          </h1>
          <p className="mt-2 text-muted-foreground">
            入会手続きが完了しました。ログインに使うパスワードを設定してください。
          </p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-xl">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-gold/20 text-gold">
                  <Lock className="size-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">パスワードを設定してください</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    6文字以上で設定してください。このパスワードでマイページにログインします。
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <div>
                  <Label htmlFor="password">パスワード（6文字以上）</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="パスワードを入力"
                    minLength={6}
                    required
                    className="mt-1"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <Label htmlFor="password-confirm">パスワード（確認）</Label>
                  <Input
                    id="password-confirm"
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="同じパスワードを再入力"
                    minLength={6}
                    required
                    className="mt-1"
                    autoComplete="new-password"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold text-gold-foreground hover:bg-gold-muted"
                >
                  {loading ? "設定中..." : "パスワードを設定してマイページを使う"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
