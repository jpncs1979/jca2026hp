"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { LogIn } from "lucide-react";

export function MypageLoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [nameKana, setNameKana] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("設定エラー");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.refresh();
      router.push("/mypage");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("設定エラー");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: name || undefined, name_kana: nameKana || undefined },
        },
      });
      if (error) throw error;
      setMessage("確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。");
      setMode("login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <LogIn className="size-10 text-gold" />
        <CardTitle>ログイン</CardTitle>
        <CardDescription>
          会員マイページをご利用になるには、ログインが必要です。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-gold-foreground hover:bg-gold-muted"
            >
              {loading ? "ログイン中..." : "ログイン"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="signup-name">お名前</Label>
              <Input
                id="signup-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="山田 太郎"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="signup-name-kana">ふりがな</Label>
              <Input
                id="signup-name-kana"
                value={nameKana}
                onChange={(e) => setNameKana(e.target.value)}
                placeholder="やまだ たろう"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="signup-email">メールアドレス</Label>
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="signup-password">パスワード（6文字以上）</Label>
              <Input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                className="mt-1"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-gold-foreground hover:bg-gold-muted"
            >
              {loading ? "登録中..." : "新規登録"}
            </Button>
          </form>
        )}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
            setMessage(null);
          }}
          className="text-sm text-gold hover:underline"
        >
          {mode === "login" ? "新規登録はこちら" : "ログインはこちら"}
        </button>
      </CardContent>
    </Card>
  );
}
