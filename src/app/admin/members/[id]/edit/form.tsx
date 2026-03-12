"use client";

import { useState } from "react";
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
import { User, Mail, CreditCard } from "lucide-react";
import { DeleteMemberButton } from "../delete-member-button";

const STATUS_OPTIONS = [
  { value: "pending", label: "承認待ち" },
  { value: "active", label: "有効" },
  { value: "expired", label: "期限切れ" },
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
  address: string;
  phone: string;
  affiliation: string;
  status: string;
  membership_type: string;
  is_ica_member: boolean;
  ica_requested: boolean;
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
      const res = await fetch(`/api/admin/members/${profileId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || null,
          name_kana: form.name_kana || null,
          email: form.email || null,
          zip_code: form.zip_code || null,
          address: form.address || null,
          phone: form.phone || null,
          affiliation: form.affiliation || null,
          status: form.status,
          membership_type: form.membership_type,
          is_ica_member: form.is_ica_member,
          ica_requested: form.ica_requested,
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
                id="ica_requested"
                checked={form.ica_requested}
                onChange={(e) => setForm((f) => ({ ...f, ica_requested: e.target.checked }))}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="ica_requested" className="cursor-pointer">ICA希望</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_css_user"
                checked={form.is_css_user}
                onChange={(e) => setForm((f) => ({ ...f, is_css_user: e.target.checked }))}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="is_css_user" className="cursor-pointer">CSS（口座振替）対象</Label>
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
            <Label htmlFor="address">住所</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="東京都..."
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
          <CardDescription>有効期限・支払方法</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="expiry_date">有効期限</Label>
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
        <DeleteMemberButton profileId={profileId} memberName={form.name || "会員"} />
      </div>
    </form>
  );
}
