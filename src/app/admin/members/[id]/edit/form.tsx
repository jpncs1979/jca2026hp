"use client";

import { useState } from "react";
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
import { User, Mail, CreditCard } from "lucide-react";
import { MemberWithdrawalButton } from "../member-withdrawal-button";
import { JAPAN_PREFECTURES, joinAddressLine } from "@/lib/japanese-address";

const STATUS_OPTIONS = [
  { value: "active", label: "有効" },
  { value: "expired", label: "期限切れ" },
  { value: "expelled", label: "強制退会" },
];

const MEMBERSHIP_OPTIONS = [
  { value: "regular", label: "正会員" },
  { value: "student", label: "学生会員" },
  { value: "supporting", label: "賛助会員" },
  { value: "friend", label: "会友" },
];

const PAYMENT_OPTIONS = [
  { value: "transfer", label: "振込" },
  { value: "css", label: "CSS" },
  { value: "stripe", label: "クレジットカード" },
];

interface InitialData {
  name: string;
  name_kana: string;
  email: string;
  zip_code: string;
  address_prefecture: string;
  address_city: string;
  address_street: string;
  address_building: string;
  phone: string;
  affiliation: string;
  status: string;
  membership_type: string;
  is_ica_member: boolean;
  is_css_user: boolean;
  officer_title: string;
  gender: string;
  birth_date: string;
  notes: string;
  expiry_date: string;
  payment_method: string;
}

export function AdminMemberEditForm({
  profileId,
  initial,
}: {
  profileId: string;
  initial: InitialData;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initial);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.birth_date?.trim()) {
      setError("生年月日は必須です。");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const addressLine = joinAddressLine({
        prefecture: form.address_prefecture,
        city: form.address_city,
        street: form.address_street,
        building: form.address_building,
      });
      const res = await fetch(`/api/admin/members/${profileId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || null,
          name_kana: form.name_kana || null,
          email: form.email || null,
          zip_code: form.zip_code || null,
          address: addressLine || null,
          address_prefecture: form.address_prefecture?.trim() || null,
          address_city: form.address_city?.trim() || null,
          address_street: form.address_street?.trim() || null,
          address_building: form.address_building?.trim() || null,
          phone: form.phone || null,
          affiliation: form.affiliation || null,
          status: form.status,
          membership_type: form.membership_type,
          is_ica_member: form.is_ica_member,
          is_css_user: form.is_css_user,
          officer_title: form.officer_title?.trim() || null,
          gender: form.gender || null,
          birth_date: form.birth_date?.trim() || null,
          notes: form.notes || null,
          expiry_date: form.expiry_date || null,
          payment_method: form.payment_method || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "更新に失敗しました");
        return;
      }
      router.push(`/admin/members/${profileId}`);
      router.refresh();
    } catch {
      setError("更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5 text-gold" />
            基本情報
          </CardTitle>
          <CardDescription>氏名・会員種別・ステータスなど</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">氏名</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="name_kana">ふりがな</Label>
              <Input
                id="name_kana"
                value={form.name_kana}
                onChange={(e) => setForm((f) => ({ ...f, name_kana: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="status">ステータス</Label>
            <select
              id="status"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="membership_type">会員種別</Label>
            <select
              id="membership_type"
              value={form.membership_type}
              onChange={(e) => setForm((f) => ({ ...f, membership_type: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {MEMBERSHIP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_ica_member"
                checked={form.is_ica_member}
                onChange={(e) => setForm((f) => ({ ...f, is_ica_member: e.target.checked }))}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="is_ica_member" className="cursor-pointer">ICA会員</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_css_user"
                checked={form.is_css_user}
                onChange={(e) => setForm((f) => ({ ...f, is_css_user: e.target.checked }))}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="is_css_user" className="cursor-pointer">
                銀行振込（CSS）対象（入金は事務局が手動で「振込済み」登録／1月のカード自動請求はしない）
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="officer_title" className="cursor-pointer whitespace-nowrap">役員職名</Label>
              <Input
                id="officer_title"
                value={form.officer_title}
                onChange={(e) => setForm((f) => ({ ...f, officer_title: e.target.value }))}
                placeholder="例: 理事、監事（空欄で非役員）"
                className="max-w-[200px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5 text-gold" />
            連絡先
          </CardTitle>
          <CardDescription>メール・電話・住所など</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">電話番号</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="03-1234-5678"
            />
          </div>
          <div>
            <Label htmlFor="zip_code">郵便番号</Label>
            <Input
              id="zip_code"
              value={form.zip_code}
              onChange={(e) => setForm((f) => ({ ...f, zip_code: e.target.value }))}
              placeholder="123-4567"
            />
          </div>
          <div>
            <Label htmlFor="address_prefecture">都道府県</Label>
            <Select
              value={form.address_prefecture || undefined}
              onValueChange={(v) => setForm((f) => ({ ...f, address_prefecture: v }))}
            >
              <SelectTrigger id="address_prefecture">
                <SelectValue placeholder="選択" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {JAPAN_PREFECTURES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="address_city">市区町村</Label>
            <Input
              id="address_city"
              value={form.address_city}
              onChange={(e) => setForm((f) => ({ ...f, address_city: e.target.value }))}
              placeholder="例：千代田区丸の内"
            />
          </div>
          <div>
            <Label htmlFor="address_street">番地</Label>
            <Input
              id="address_street"
              value={form.address_street}
              onChange={(e) => setForm((f) => ({ ...f, address_street: e.target.value }))}
              placeholder="例：1-1-1"
            />
          </div>
          <div>
            <Label htmlFor="address_building">建物名・部屋番号</Label>
            <Input
              id="address_building"
              value={form.address_building}
              onChange={(e) => setForm((f) => ({ ...f, address_building: e.target.value }))}
              placeholder="任意"
            />
          </div>
          <div>
            <Label htmlFor="affiliation">所属</Label>
            <Input
              id="affiliation"
              value={form.affiliation}
              onChange={(e) => setForm((f) => ({ ...f, affiliation: e.target.value }))}
              placeholder="学校名・団体名など"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5 text-gold" />
            会員資格・有効期限
          </CardTitle>
          <CardDescription>会員資格の末日（通常は会員年度の3/31）・支払方法</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="expiry_date">会員資格の末日（4/1〜翌3/31 の期間の終わり。多くは3/31）</Label>
            <Input
              id="expiry_date"
              type="date"
              value={form.expiry_date}
              onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="payment_method">支払方法</Label>
            <select
              id="payment_method"
              value={form.payment_method}
              onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {PAYMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>その他</CardTitle>
          <CardDescription>生年月日（必須）・性別・備考</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="birth_date">生年月日 *</Label>
            <Input
              id="birth_date"
              type="date"
              value={form.birth_date}
              onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="gender">性別</Label>
            <Input
              id="gender"
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
              placeholder="男 / 女"
            />
          </div>
          <div>
            <Label htmlFor="notes">備考</Label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving} className="bg-gold text-gold-foreground hover:bg-gold-muted">
          {saving ? "保存中..." : "保存する"}
        </Button>
        <Link href={`/admin/members/${profileId}`}>
          <Button type="button" variant="outline">キャンセル</Button>
        </Link>
        {form.status === "active" && (
          <MemberWithdrawalButton profileId={profileId} memberName={form.name || "会員"} />
        )}
      </div>
    </form>
  );
}
