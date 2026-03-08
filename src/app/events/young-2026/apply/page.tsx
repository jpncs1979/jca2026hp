"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { YOUNG_2026 } from "@/lib/young-2026";
import { supabase } from "@/lib/supabase";

const REFERENCE_DATE = new Date(YOUNG_2026.referenceDate);

function calculateAge(birthDate: Date): number {
  const ref = REFERENCE_DATE;
  let age = ref.getFullYear() - birthDate.getFullYear();
  const m = ref.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birthDate.getDate())) age--;
  return age;
}

const formSchema = z.object({
  name: z.string().min(1, "お名前を入力してください"),
  furigana: z.string().min(1, "ふりがなを入力してください"),
  email: z.string().min(1, "メールアドレスを入力してください").email("有効なメールアドレスを入力してください"),
  birth_date: z.string().min(1, "生年月日を入力してください"),
  member_type: z.enum(["会員", "非会員", "同時入会"]),
  member_number: z.string().optional(),
  category: z.enum(["ジュニアA", "ジュニアB", "ヤング"]),
  selected_piece_preliminary: z.string().optional(),
  selected_piece_final: z.string().optional(),
  video_url: z.string().optional(),
  accompanist_info: z.string().optional(),
}).refine((data) => {
  const birth = new Date(data.birth_date);
  if (isNaN(birth.getTime())) return false;
  const age = calculateAge(birth);
  const cat = YOUNG_2026.eligibility.categories.find((c) => c.id === data.category);
  return cat ? age <= cat.maxAge : false;
}, {
  message: "2026年4月1日時点の年齢が部門の上限を超えています",
  path: ["birth_date"],
}).refine((data) => {
  if (data.category === "ジュニアA" && !data.selected_piece_preliminary) return false;
  if (data.category === "ジュニアB" && !data.selected_piece_final) return false;
  if (data.category === "ヤング" && (!data.selected_piece_preliminary || !data.selected_piece_final)) return false;
  return true;
}, {
  message: "課題曲を選択してください",
  path: ["selected_piece_preliminary"],
}).refine((data) => {
  if (data.member_type === "会員" && !data.member_number?.trim()) return false;
  return true;
}, {
  message: "会員の場合は会員番号を入力してください",
  path: ["member_number"],
});

type FormValues = z.infer<typeof formSchema>;

/** yyyy/mm/dd 形式の生年月日入力。年4桁で月へ、月2桁で日に自動フォーカス */
function BirthDateInput({
  value,
  onChange,
  onBlur,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
}) {
  const parse = (v: string) => {
    if (!v) return { year: "", month: "", day: "" };
    const parts = v.split("-");
    return {
      year: parts[0]?.replace(/\D/g, "").slice(0, 4) ?? "",
      month: parts[1]?.replace(/\D/g, "").slice(0, 2) ?? "",
      day: parts[2]?.replace(/\D/g, "").slice(0, 2) ?? "",
    };
  };

  const [local, setLocal] = React.useState(parse(value || ""));
  React.useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      setLocal(parse(value));
    }
    // value が "" のときは local を更新しない（部分入力の保持）
  }, [value]);

  const yearRef = React.useRef<HTMLInputElement>(null);
  const monthRef = React.useRef<HTMLInputElement>(null);
  const dayRef = React.useRef<HTMLInputElement>(null);

  const commit = (y: string, m: string, d: string) => {
    const yy = y.replace(/\D/g, "").slice(0, 4);
    const mm = m.replace(/\D/g, "").slice(0, 2);
    const dd = d.replace(/\D/g, "").slice(0, 2);
    setLocal({ year: yy, month: mm, day: dd });
    if (yy.length === 4 && mm.length === 2 && dd.length === 2) {
      onChange(`${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`);
    } else {
      onChange("");
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
    commit(v, local.month, local.day);
    if (v.length === 4) monthRef.current?.focus();
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 2);
    commit(local.year, v, local.day);
    if (v.length === 2) dayRef.current?.focus();
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 2);
    commit(local.year, local.month, v);
  };

  return (
    <div className="flex items-center gap-1">
      <Input
        ref={yearRef}
        type="text"
        inputMode="numeric"
        placeholder="yyyy"
        maxLength={4}
        value={local.year}
        onChange={handleYearChange}
        onBlur={onBlur}
        disabled={disabled}
        className="w-20 text-center"
      />
      <span className="text-muted-foreground">/</span>
      <Input
        ref={monthRef}
        type="text"
        inputMode="numeric"
        placeholder="mm"
        maxLength={2}
        value={local.month}
        onChange={handleMonthChange}
        onBlur={onBlur}
        disabled={disabled}
        className="w-14 text-center"
      />
      <span className="text-muted-foreground">/</span>
      <Input
        ref={dayRef}
        type="text"
        inputMode="numeric"
        placeholder="dd"
        maxLength={2}
        value={local.day}
        onChange={handleDayChange}
        onBlur={onBlur}
        disabled={disabled}
        className="w-14 text-center"
      />
    </div>
  );
}

export default function ApplyPage() {
  const router = useRouter();
  const [competitionId, setCompetitionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      furigana: "",
      email: "",
      birth_date: "",
      member_type: "非会員",
      member_number: "",
      category: "ジュニアA",
      selected_piece_preliminary: "",
      selected_piece_final: "",
      video_url: "",
      accompanist_info: "",
    },
  });

  const category = form.watch("category");
  const memberType = form.watch("member_type");

  useEffect(() => {
    if (category === "ジュニアB") {
      form.setValue(
        "selected_piece_preliminary",
        "C.Rose / 32 Etudes より No.17 および No.26（両方）"
      );
    }
    if (category === "ジュニアA") {
      form.setValue("selected_piece_final", "");
    }
  }, [category, form]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("competitions")
        .select("id")
        .eq("slug", YOUNG_2026.slug)
        .single();
      setCompetitionId(data?.id ?? null);
      setLoading(false);
    })();
  }, []);

  const feeRaw =
    category && memberType
      ? memberType === "同時入会"
        ? (YOUNG_2026.fees[category as keyof typeof YOUNG_2026.fees]?.非会員 ?? 10000) + YOUNG_2026.firstYearMembershipFee
        : YOUNG_2026.fees[category as keyof typeof YOUNG_2026.fees]?.[memberType as "会員" | "非会員"]
      : undefined;

  const onSubmit = async (values: FormValues) => {
    if (!competitionId || !supabase) {
      setError("申込の準備ができていません。環境変数の設定を確認するか、しばらくしてから再度お試しください。");
      return;
    }
    setSubmitting(true);
    setError(null);

    const birth = new Date(values.birth_date);
    const age = calculateAge(birth);

    const res = await fetch("/api/events/young-2026/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        competition_id: competitionId,
        name: values.name,
        furigana: values.furigana,
        email: values.email,
        birth_date: values.birth_date,
        age_at_reference: age,
        member_type: values.member_type,
        member_number: values.member_type === "会員" ? values.member_number || null : null,
        category: values.category,
        selected_piece_preliminary: values.selected_piece_preliminary || null,
        selected_piece_final:
          values.category === "ジュニアB" || values.category === "ヤング"
            ? values.selected_piece_final || null
            : null,
        video_url: YOUNG_2026.requiresVideo.includes(values.category as "ジュニアA" | "ジュニアB")
          ? values.video_url || null
          : null,
        accompanist_info: values.accompanist_info || null,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "申込の送信に失敗しました。しばらくしてから再度お試しください。");
      return;
    }

    router.push("/events/young-2026/apply/complete");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center text-destructive">
          Supabaseの環境変数（NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY）が設定されていません。
        </p>
        <div className="mt-4 text-center">
          <Link href="/events/young-2026">
            <Button variant="outline">詳細ページに戻る</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!competitionId) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center text-destructive">
          申込の準備ができていません。competitions テーブルにデータが登録されているか確認してください。
        </p>
        <div className="mt-4 text-center">
          <Link href="/events/young-2026">
            <Button variant="outline">詳細ページに戻る</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-navy md:text-3xl">
            {YOUNG_2026.name} 参加申込
          </h1>
          <p className="mt-2 text-muted-foreground">
            {YOUNG_2026.eventDateRange} / {YOUNG_2026.venue.name}（{YOUNG_2026.venue.address}）
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                {error}
              </div>
            )}

            <section className="space-y-4">
              <h2 className="text-lg font-medium text-navy">応募者情報</h2>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>お名前 *</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="山田 太郎" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="furigana"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ふりがな *</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="やまだ たろう" />
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
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormDescription>
                      {YOUNG_2026.referenceDate.replace(/-/g, "/")}時点の年齢で部門の適合判定を行います
                    </FormDescription>
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
                      <Input type="email" {...field} value={field.value ?? ""} placeholder="example@email.com" />
                    </FormControl>
                    <FormDescription>
                      申込内容の確認メールをお送りします
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-medium text-navy">会員種別</h2>
              <FormField
                control={form.control}
                name="member_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>会員種別 *</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        value={field.value ?? ""}
                        className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                      >
                        <option value="非会員">非会員</option>
                        <option value="会員">会員</option>
                        <option value="同時入会">同時入会</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {memberType === "会員" && (
                <FormField
                  control={form.control}
                  name="member_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>会員番号 *</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} placeholder="例: 12345" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-medium text-navy">部門・課題曲</h2>
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>部門 *</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          field.onChange(e);
                          form.setValue("selected_piece_preliminary", "");
                          form.setValue("selected_piece_final", "");
                        }}
                        className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                      >
                        {YOUNG_2026.eligibility.categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}（{c.condition}）
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {category === "ジュニアA" && (
                <FormField
                  control={form.control}
                  name="selected_piece_preliminary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>予選課題曲（J.Lancelot / 21 Etudes（Billaudot 版）より No.7、No.9 より 1 曲選択）*</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          value={field.value ?? ""}
                          className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                        >
                          <option value="">選択してください</option>
                          {YOUNG_2026.pieces.ジュニアA.予選.options.map((p) => (
                            <option key={p.id} value={p.label}>{p.label}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormDescription>※動画提出</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {category === "ジュニアB" && (
                <>
                  <FormField
                    control={form.control}
                    name="selected_piece_preliminary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>予選課題曲 *</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} readOnly className="bg-muted" />
                        </FormControl>
                        <FormDescription>C.Rose / 32 Etudes より No.17 および No.26 の 2 曲（両方必須）※動画提出</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="selected_piece_final"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>本選課題曲（伴奏付・下記より 1 曲選択）*</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            value={field.value ?? ""}
                            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                          >
                            <option value="">選択してください</option>
                            {YOUNG_2026.pieces.ジュニアB.本選.options.map((p) => (
                              <option key={p.id} value={p.label}>{p.label}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {category === "ヤング" && (
                <>
                  <FormField
                    control={form.control}
                    name="selected_piece_preliminary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>第一次予選課題曲（無伴奏・下記より 1 曲選択）*</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            value={field.value ?? ""}
                            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                          >
                            <option value="">選択してください</option>
                            {YOUNG_2026.pieces.ヤング.第一次予選.options.map((p) => (
                              <option key={p.id} value={p.label}>{p.label}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="selected_piece_final"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>第二次予選課題曲（伴奏付・下記より 1 曲選択）*</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            value={field.value ?? ""}
                            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                          >
                            <option value="">選択してください</option>
                            {YOUNG_2026.pieces.ヤング.第二次予選.options.map((p) => (
                              <option key={p.id} value={p.label}>{p.label}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {YOUNG_2026.requiresVideo.includes(category as "ジュニアA" | "ジュニアB") && (
                <FormField
                  control={form.control}
                  name="video_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>予選動画URL</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} placeholder="https://..." />
                      </FormControl>
                      <FormDescription>
                        ジュニアA・B部門は予選動画の提出が必要です
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </section>

            <FormField
              control={form.control}
              name="accompanist_info"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>伴奏者情報・備考</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      rows={3}
                      placeholder="伴奏者名、連絡先。ジュニア A 部門でピアニスト委嘱希望の場合は「ピアニスト希望」と記入"
                    />
                  </FormControl>
                  <FormDescription>
                    ジュニア B 部門、ヤング・アーティスト部門は伴奏者を参加者自身が委嘱同伴。ジュニア A 部門は希望者にピアニストを協会で用意可（備考欄に「ピアニスト希望」と記入）
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <section className="rounded-lg border border-border bg-muted/30 p-6">
              <p className="text-lg font-medium">
                参加費：{feeRaw != null ? (
                  <span className="text-gold">{feeRaw.toLocaleString()}円</span>
                ) : memberType === "同時入会" ? (
                  <span className="text-gold">
                    {category && (YOUNG_2026.fees[category as keyof typeof YOUNG_2026.fees]?.非会員 ?? 0) + YOUNG_2026.firstYearMembershipFee}円
                  </span>
                ) : (
                  <span className="text-muted-foreground">部門・会員種別を選択してください</span>
                )}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                支払方法：銀行振込またはクレジットカード（Stripe）をご選択ください
              </p>
            </section>

            <div className="flex flex-wrap gap-4">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gold text-gold-foreground hover:bg-gold-muted"
              >
                {submitting ? "送信中..." : "申し込む（銀行振込）"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={submitting || feeRaw == null}
                className="border-gold text-gold hover:bg-gold/10"
                onClick={async () => {
                  const valid = await form.trigger();
                  if (!valid || !competitionId) return;
                  const values = form.getValues();
                  setSubmitting(true);
                  setError(null);
                  const res = await fetch("/api/events/young-2026/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      competition_id: competitionId,
                      name: values.name,
                      furigana: values.furigana,
                      email: values.email,
                      birth_date: values.birth_date,
                      member_type: values.member_type,
                      member_number: values.member_number,
                      category: values.category,
                      selected_piece_preliminary: values.selected_piece_preliminary,
                      selected_piece_final: values.selected_piece_final,
                      video_url: values.video_url,
                      accompanist_info: values.accompanist_info,
                    }),
                  });
                  const data = await res.json().catch(() => ({}));
                  setSubmitting(false);
                  if (!res.ok) {
                    setError(data.error ?? "決済の準備に失敗しました。");
                    return;
                  }
                  if (data.url) window.location.href = data.url;
                }}
              >
                {submitting ? "処理中..." : "申し込む（クレジットカード）"}
              </Button>
              <Link href="/events/young-2026">
                <Button type="button" variant="outline">
                  キャンセル
                </Button>
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
