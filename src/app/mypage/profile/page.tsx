"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft } from "lucide-react";

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<{
    id: string;
    name: string;
    name_kana: string;
    email: string;
    zip_code: string | null;
    address: string | null;
    phone: string | null;
    affiliation: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      if (!supabase) {
        router.replace("/mypage");
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/mypage");
        return;
      }
      try {
        const res = await fetch("/api/mypage/data");
        const data = await res.json();
        if (res.ok && data.profile) {
          const p = data.profile;
          setProfile({
            id: p.id,
            name: p.name ?? "",
            name_kana: p.name_kana ?? "",
            email: p.email ?? "",
            zip_code: p.zip_code ?? null,
            address: p.address ?? null,
            phone: p.phone ?? null,
            affiliation: p.affiliation ?? null,
          });
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      }
      setLoading(false);
    })();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await fetch("/api/mypage/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zip_code: formData.get("zip_code") || null,
        address: formData.get("address") || null,
        phone: formData.get("phone") || null,
        affiliation: formData.get("affiliation") || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "更新に失敗しました");
      return;
    }
    router.push("/mypage");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center text-muted-foreground">読み込み中...</p>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center text-muted-foreground">会員情報を取得できませんでした。</p>
        <Link href="/mypage" className="mt-4 block text-center text-gold hover:underline">
          マイページに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <Link href="/mypage" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-navy">
            <ArrowLeft className="size-4" />
            マイページに戻る
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-navy md:text-3xl">
            プロフィール編集
          </h1>
          <p className="mt-1 text-muted-foreground">
            住所・連絡先・所属の変更申請
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>登録情報</CardTitle>
            <CardDescription>
              変更可能な項目を編集してください。氏名・メールの変更は事務局までご連絡ください。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div>
                <Label>お名前（変更不可）</Label>
                <Input value={profile.name} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>ふりがな（変更不可）</Label>
                <Input value={profile.name_kana} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>メールアドレス（変更不可）</Label>
                <Input type="email" value={profile.email} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>郵便番号</Label>
                <Input name="zip_code" defaultValue={profile.zip_code ?? ""} placeholder="123-4567" />
              </div>
              <div>
                <Label>住所</Label>
                <Input name="address" defaultValue={profile.address ?? ""} placeholder="東京都..." />
              </div>
              <div>
                <Label>電話番号</Label>
                <Input name="phone" defaultValue={profile.phone ?? ""} placeholder="03-1234-5678" />
              </div>
              <div>
                <Label>所属</Label>
                <Input name="affiliation" defaultValue={profile.affiliation ?? ""} placeholder="学校名・団体名など" />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={saving} className="bg-gold text-gold-foreground hover:bg-gold-muted">
                  {saving ? "保存中..." : "保存する"}
                </Button>
                <Link href="/mypage">
                  <Button type="button" variant="outline">キャンセル</Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
