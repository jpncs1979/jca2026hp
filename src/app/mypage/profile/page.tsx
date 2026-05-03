"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft } from "lucide-react";
import { JAPAN_PREFECTURES, joinAddressLine } from "@/lib/japanese-address";

type ProfileState = {
  id: string;
  name: string;
  name_kana: string;
  email: string;
  zip_code: string | null;
  address_prefecture: string;
  address_city: string;
  address_street: string;
  address_building: string;
  phone: string | null;
  affiliation: string | null;
};

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileState | null>(null);
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
          const p = data.profile as ProfileState & {
            address?: string | null;
            address_prefecture?: string | null;
            address_city?: string | null;
            address_street?: string | null;
            address_building?: string | null;
          };
          const hasSplit =
            (p.address_prefecture?.trim() ?? "") !== "" ||
            (p.address_city?.trim() ?? "") !== "" ||
            (p.address_street?.trim() ?? "") !== "";
          setProfile({
            id: p.id,
            name: p.name ?? "",
            name_kana: p.name_kana ?? "",
            email: p.email ?? "",
            zip_code: p.zip_code ?? null,
            address_prefecture: p.address_prefecture ?? "",
            address_city: p.address_city ?? "",
            address_street: hasSplit ? (p.address_street ?? "") : (p.address ?? ""),
            address_building: p.address_building ?? "",
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
    const addressLine = joinAddressLine({
      prefecture: profile.address_prefecture,
      city: profile.address_city,
      street: profile.address_street,
      building: profile.address_building,
    });
    const res = await fetch("/api/mypage/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zip_code: profile.zip_code || null,
        address: addressLine || null,
        address_prefecture: profile.address_prefecture?.trim() || null,
        address_city: profile.address_city?.trim() || null,
        address_street: profile.address_street?.trim() || null,
        address_building: profile.address_building?.trim() || null,
        phone: profile.phone || null,
        affiliation: profile.affiliation || null,
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
                <Label htmlFor="zip_code">郵便番号</Label>
                <Input
                  id="zip_code"
                  value={profile.zip_code ?? ""}
                  onChange={(e) => setProfile((p) => (p ? { ...p, zip_code: e.target.value } : p))}
                  placeholder="123-4567"
                />
              </div>
              <div>
                <Label htmlFor="address_prefecture">都道府県</Label>
                <Select
                  value={profile.address_prefecture || undefined}
                  onValueChange={(v) =>
                    setProfile((p) => (p ? { ...p, address_prefecture: v } : p))
                  }
                >
                  <SelectTrigger id="address_prefecture">
                    <SelectValue placeholder="選択" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {JAPAN_PREFECTURES.map((pref) => (
                      <SelectItem key={pref} value={pref}>
                        {pref}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="address_city">市区町村</Label>
                <Input
                  id="address_city"
                  value={profile.address_city}
                  onChange={(e) =>
                    setProfile((p) => (p ? { ...p, address_city: e.target.value } : p))
                  }
                  placeholder="例：千代田区丸の内"
                />
              </div>
              <div>
                <Label htmlFor="address_street">番地</Label>
                <Input
                  id="address_street"
                  value={profile.address_street}
                  onChange={(e) =>
                    setProfile((p) => (p ? { ...p, address_street: e.target.value } : p))
                  }
                  placeholder="例：1-1-1"
                />
              </div>
              <div>
                <Label htmlFor="address_building">建物名・部屋番号</Label>
                <Input
                  id="address_building"
                  value={profile.address_building}
                  onChange={(e) =>
                    setProfile((p) => (p ? { ...p, address_building: e.target.value } : p))
                  }
                  placeholder="任意"
                />
              </div>
              <div>
                <Label htmlFor="phone">電話番号</Label>
                <Input
                  id="phone"
                  value={profile.phone ?? ""}
                  onChange={(e) => setProfile((p) => (p ? { ...p, phone: e.target.value } : p))}
                  placeholder="03-1234-5678"
                />
              </div>
              <div>
                <Label htmlFor="affiliation">所属</Label>
                <Input
                  id="affiliation"
                  value={profile.affiliation ?? ""}
                  onChange={(e) =>
                    setProfile((p) => (p ? { ...p, affiliation: e.target.value } : p))
                  }
                  placeholder="学校名・団体名など"
                />
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
