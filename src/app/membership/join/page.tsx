"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ENTRANCE_FEE,
  REGULAR_ANNUAL,
  STUDENT_ANNUAL,
  getMembershipJoinAmount,
} from "@/lib/membership-fees";

/** yyyy/mm/dd / yyyy-mm-dd / 8桁数字 を Date にパース。無効なら null */
function parseBirthDate(s: string): Date | null {
  const raw = s.trim();
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 8) {
    const y = parseInt(digits.slice(0, 4), 10);
    const mo = parseInt(digits.slice(4, 6), 10);
    const day = parseInt(digits.slice(6, 8), 10);
    const d = new Date(y, mo - 1, day);
    if (d.getFullYear() === y && d.getMonth() === mo - 1 && d.getDate() === day)
      return d;
    return null;
  }
  const normalized = raw.replace(/\//g, "-");
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date を yyyy-mm-dd にフォーマット（API送信用） */
function formatBirthDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 生年月日：数字のみ入力（年・月・日）。value は yyyy-mm-dd または空 */
function BirthDateInput({
  value,
  onChange,
  onBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
}) {
  const n = (value ?? "").replace(/\D/g, "");
  const y = n.length >= 1 ? n.slice(0, 4) : "";
  const m = n.length >= 5 ? n.slice(4, 6) : "";
  const d = n.length >= 7 ? n.slice(6, 8) : "";

  const commit = (yy: string, mm: string, dd: string) => {
    const yy4 = yy.replace(/\D/g, "").slice(0, 4);
    const mm2 = mm.replace(/\D/g, "").slice(0, 2);
    const dd2 = dd.replace(/\D/g, "").slice(0, 2);
    if (yy4.length === 4 && mm2.length === 2 && dd2.length === 2) {
      onChange(`${yy4}-${mm2}-${dd2}`);
    } else {
      onChange(yy4 + mm2 + dd2);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2" onBlur={onBlur}>
      <div className="flex items-center gap-1">
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="年"
          maxLength={4}
          value={y}
          onChange={(e) => commit(e.target.value.replace(/\D/g, ""), m, d)}
          className="w-20"
        />
        <span className="text-muted-foreground">年</span>
      </div>
      <div className="flex items-center gap-1">
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="月"
          maxLength={2}
          value={m}
          onChange={(e) => commit(y, e.target.value.replace(/\D/g, ""), d)}
          className="w-14"
        />
        <span className="text-muted-foreground">月</span>
      </div>
      <div className="flex items-center gap-1">
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="日"
          maxLength={2}
          value={d}
          onChange={(e) => commit(y, m, e.target.value.replace(/\D/g, ""))}
          className="w-14"
        />
        <span className="text-muted-foreground">日</span>
      </div>
    </div>
  );
}

const formSchema = z.object({
  name: z.string().min(1, "お名前（漢字）を入力してください"),
  name_kana: z.string().min(1, "ふりがなを入力してください"),
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください"),
  birth_date: z.string().min(1, "生年月日を入力してください"),
  gender: z.string().optional(),
  zip_code: z.string().min(1, "郵便番号を入力してください"),
  address: z.string().min(1, "住所を入力してください"),
  phone: z.string().min(1, "電話番号を入力してください"),
  ica_requested: z.boolean(),
  membership_type: z.enum(["regular", "student"]),
}).refine(
  (data) =>
    data.birth_date.replace(/\D/g, "").length === 8 &&
    parseBirthDate(data.birth_date) !== null,
  { message: "生年月日を8桁の数字で入力してください（例：19900115）", path: ["birth_date"] }
);

type FormValues = z.infer<typeof formSchema>;

export default function MembershipJoinPage() {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      name_kana: "",
      email: "",
      birth_date: "",
      gender: "",
      zip_code: "",
      address: "",
      phone: "",
      ica_requested: false,
      membership_type: "regular",
    },
  });

  const membershipType = form.watch("membership_type");
  const birthDateStr = form.watch("birth_date");
  const joinDate = new Date();
  const amount =
    birthDateStr && parseBirthDate(birthDateStr)
      ? getMembershipJoinAmount(membershipType, joinDate)
      : null;

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setErrorMessage(null);
    const birthDateIso = parseBirthDate(values.birth_date);
    const birthDateForApi = birthDateIso
      ? formatBirthDate(birthDateIso)
      : values.birth_date.trim().replace(/\D/g, "").length === 8
        ? values.birth_date.trim().replace(/\D/g, "").replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")
        : values.birth_date.trim().replace(/\//g, "-");
    try {
      const res = await fetch("/api/membership/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          name_kana: values.name_kana,
          email: values.email,
          birth_date: birthDateForApi,
          gender: values.gender || undefined,
          zip_code: values.zip_code || undefined,
          address: values.address || undefined,
          phone: values.phone || undefined,
          ica_requested: values.ica_requested,
          membership_type: values.membership_type,
        }),
      });
      let data: { error?: string; url?: string };
      try {
        data = await res.json();
      } catch {
        setErrorMessage(
          res.ok
            ? "決済ページへ進めませんでした。"
            : `サーバーエラー（${res.status}）。しばらくしてからお試しください。`
        );
        return;
      }
      if (!res.ok) {
        setErrorMessage(data.error ?? "申し込みの送信に失敗しました。");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setErrorMessage("決済ページへ進めませんでした。");
    } catch (e) {
      console.error("Checkout request failed:", e);
      setErrorMessage(
        "通信エラーが発生しました。ネットワークをご確認のうえ、再度お試しください。"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-navy md:text-4xl">
            入会申し込み
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {errorMessage && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {errorMessage}
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">会員種別</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="membership_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>会員種別</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="会員種別を選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="regular">正会員</SelectItem>
                            <SelectItem value="student">学生会員</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ica_requested"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start gap-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-0.5 leading-none">
                          <FormLabel className="font-normal">
                            ICA会員入会（無料）
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">ご本人情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>お名前（漢字） *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="山田 太郎" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name_kana"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ふりがな *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="やまだ たろう" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>メールアドレス *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            {...field}
                            placeholder="example@email.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="birth_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>生年月日 *</FormLabel>
                        <FormControl>
                          <BirthDateInput
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>性別</FormLabel>
                        <Select
                          onValueChange={(v) =>
                            field.onChange(v === "_" ? undefined : v)
                          }
                          value={field.value && field.value !== "" ? field.value : "_"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="_">選択</SelectItem>
                            <SelectItem value="male">男性</SelectItem>
                            <SelectItem value="female">女性</SelectItem>
                            <SelectItem value="other">その他</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zip_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>郵便番号 *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="100-0001" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>住所 *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="東京都千代田区..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>電話番号 *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="03-1234-5678" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {amount !== null && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">
                      入会金 {ENTRANCE_FEE.toLocaleString()}円
                      ＋ 会費（1年分）
                      ＝ <strong className="text-foreground">{amount.toLocaleString()}円</strong>
                      {joinDate.getMonth() >= 9 && (
                        <span className="ml-1 text-sm">
                          （10〜12月入会のため、翌年度分を含みます）
                        </span>
                      )}
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-gold text-gold-foreground hover:bg-gold-muted"
                >
                  {submitting ? "送信中…" : "クレジットカードで支払う"}
                </Button>
                <Link href="/membership">
                  <Button type="button" variant="outline">
                    入会案内に戻る
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
