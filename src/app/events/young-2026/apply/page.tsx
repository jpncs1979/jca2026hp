"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
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
import { YOUNG_2026 } from "@/lib/young-2026";
import { supabase } from "@/lib/supabase";
import { JAPAN_PREFECTURES } from "@/lib/japanese-address";
import {
  fileToPortraitDataUrl,
  PORTRAIT_ACCEPT,
  PORTRAIT_MAX_BYTES,
} from "@/lib/portrait-image";
import {
  isRestorableYoung2026ApplyPayload,
  loadYoung2026ApplyConfirmPayload,
  saveYoung2026ApplyConfirmPayload,
  young2026ApplyFeeYen,
} from "@/lib/young-2026-apply-confirm";

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
  affiliation: z.string().min(1, "所属（出身校等）を入力してください"),
  zip_code: z.string().min(1, "郵便番号を入力してください"),
  address_prefecture: z.string().min(1, "都道府県を選択してください"),
  address_city: z.string().min(1, "市区町村を入力してください"),
  address_street: z.string().min(1, "番地を入力してください"),
  address_building: z.string().optional(),
  phone: z
    .string()
    .min(1, "携帯電話番号を入力してください")
    .refine((v) => v.replace(/\D/g, "").length >= 10, {
      message: "有効な携帯電話番号を入力してください",
    }),
  member_type: z.enum(["会員", "非会員"]),
  category: z.enum(["ジュニアA", "ジュニアB", "ヤング"]),
  selected_piece_preliminary: z.string().optional(),
  selected_piece_final: z.string().optional(),
  video_url: z.string().optional(),
  accompanist_info: z.string().min(1, "伴奏者氏名を入力してください"),
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
});

type FormValues = z.infer<typeof formSchema>;

function draftToFormValues(d: {
  name: string;
  furigana: string;
  email: string;
  birth_date: string;
  affiliation?: string;
  zip_code?: string;
  address_prefecture?: string;
  address_city?: string;
  address_street?: string;
  address_building?: string;
  phone?: string;
  member_type: FormValues["member_type"];
  category: FormValues["category"];
  selected_piece_preliminary?: string | null;
  selected_piece_final?: string | null;
  video_url?: string | null;
  accompanist_info?: string | null;
}): FormValues {
  return {
    name: d.name,
    furigana: d.furigana,
    email: d.email,
    birth_date: d.birth_date,
    affiliation: d.affiliation ?? "",
    zip_code: d.zip_code ?? "",
    address_prefecture: d.address_prefecture ?? "",
    address_city: d.address_city ?? "",
    address_street: d.address_street ?? "",
    address_building: d.address_building ?? "",
    phone: d.phone ?? "",
    member_type: d.member_type,
    category: d.category,
    selected_piece_preliminary: d.selected_piece_preliminary ?? "",
    selected_piece_final: d.selected_piece_final ?? "",
    video_url: d.video_url ?? "",
    accompanist_info: d.accompanist_info ?? "",
  };
}

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
  const draftHydratedRef = useRef(false);
  const [competitionId, setCompetitionId] = useState<string | null>(null);
  const [gateLoading, setGateLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [portraitFileName, setPortraitFileName] = useState<string | null>(null);
  const [portraitPreviewUrl, setPortraitPreviewUrl] = useState<string | null>(null);
  const [portraitError, setPortraitError] = useState<string | null>(null);
  const portraitFileRef = useRef<File | null>(null);
  const portraitDataUrlRef = useRef<string | null>(null);
  const applicationOpen = periodOpen || isAdmin;
  const adminTestMode = isAdmin && !periodOpen;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      furigana: "",
      email: "",
      birth_date: "",
      affiliation: "",
      zip_code: "",
      address_prefecture: "",
      address_city: "",
      address_street: "",
      address_building: "",
      phone: "",
      member_type: "非会員",
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
    fetch(`/api/events/competition-gate?slug=${YOUNG_2026.slug}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(
        (data: {
          competitionId?: string | null;
          isAdmin?: boolean;
          periodOpen?: boolean;
        }) => {
          setCompetitionId(data.competitionId ?? null);
          setIsAdmin(data.isAdmin === true);
          setPeriodOpen(data.periodOpen === true);
        }
      )
      .catch(() => {
        setCompetitionId(null);
        setIsAdmin(false);
        setPeriodOpen(false);
      })
      .finally(() => setGateLoading(false));
  }, []);

  /** 確認ページから「修正する」で戻ったとき、sessionStorage の下書きをフォームに流し込む（マウント後1回のみ） */
  useEffect(() => {
    if (gateLoading || !competitionId || draftHydratedRef.current) return;
    const raw = loadYoung2026ApplyConfirmPayload();
    if (!raw || raw.competitionId !== competitionId || !isRestorableYoung2026ApplyPayload(raw)) {
      return;
    }
    form.reset(draftToFormValues(raw));
    if (typeof raw.portrait_data_url === "string" && raw.portrait_data_url.startsWith("data:image/")) {
      portraitDataUrlRef.current = raw.portrait_data_url;
      setPortraitPreviewUrl(raw.portrait_data_url);
      setPortraitFileName("提出済みの顔写真");
    }
    draftHydratedRef.current = true;
  }, [gateLoading, competitionId, form]);

  const feeRaw =
    category && memberType ? young2026ApplyFeeYen(category, memberType) : null;

  if (gateLoading) {
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

  if (!applicationOpen) {
    return (
      <div className="font-soft">
        <div className="container mx-auto max-w-2xl px-4 py-16">
          <h1 className="text-2xl font-bold text-navy">申込受付期間外です</h1>
          <p className="mt-4 text-muted-foreground">
            申込受付期間は {YOUNG_2026.applicationPeriod} です。
          </p>
          <Link href="/events/young-2026" className="mt-8 inline-block">
            <Button variant="outline">コンクール詳細に戻る</Button>
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
        {adminTestMode && (
          <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            事務局テストモード：受付期間外ですが、申込フォームと決済のテストができます。
          </div>
        )}
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className="space-y-8"
          >
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
                name="affiliation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>所属（出身校等） *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="○○高等学校 / ○○音楽大学 など"
                      />
                    </FormControl>
                    <FormDescription>
                      学校名・団体名・勤務先など、わかる範囲でご記入ください。
                    </FormDescription>
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
                      月・日はそれぞれ2桁で入力してください（例: 1月1日 → 01 / 01）。
                      {YOUNG_2026.referenceDate.replace(/-/g, "/")}
                      時点の年齢で部門の適合判定を行います。
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
                      お申し込みに関するご連絡に使用します。
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>携帯電話番号 *</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        {...field}
                        value={field.value ?? ""}
                        placeholder="090-1234-5678"
                      />
                    </FormControl>
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
                      <Input {...field} value={field.value ?? ""} placeholder="100-0001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address_prefecture"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>都道府県 *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {JAPAN_PREFECTURES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address_city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>市区町村 *</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="千代田区千代田" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address_street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>番地 *</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="1-1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address_building"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>建物名・部屋番号</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="○○マンション 101" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <Label htmlFor="portrait">顔写真 *</Label>
                <Input
                  id="portrait"
                  type="file"
                  accept={PORTRAIT_ACCEPT}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setPortraitError(null);
                    portraitFileRef.current = file;
                    portraitDataUrlRef.current = null;
                    if (portraitPreviewUrl && portraitPreviewUrl.startsWith("blob:")) {
                      URL.revokeObjectURL(portraitPreviewUrl);
                    }
                    if (!file) {
                      setPortraitFileName(null);
                      setPortraitPreviewUrl(null);
                      return;
                    }
                    if (file.size > PORTRAIT_MAX_BYTES) {
                      setPortraitError("顔写真は 5MB 以下にしてください。");
                      setPortraitFileName(null);
                      setPortraitPreviewUrl(null);
                      portraitFileRef.current = null;
                      return;
                    }
                    setPortraitFileName(file.name);
                    setPortraitPreviewUrl(URL.createObjectURL(file));
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  正面を向いた顔写真（JPEG / PNG / WebP、5MB以下）を提出してください。
                </p>
                {portraitFileName ? (
                  <p className="text-sm text-foreground">選択中: {portraitFileName}</p>
                ) : null}
                {portraitPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={portraitPreviewUrl}
                    alt="顔写真プレビュー"
                    className="mt-2 h-40 w-40 rounded-md border border-border object-cover"
                  />
                ) : null}
                {portraitError ? (
                  <p className="text-sm text-destructive">{portraitError}</p>
                ) : null}
              </div>
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
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {memberType === "会員" && (
                <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  <p>申し込み時点で入会している必要があります。</p>
                  <p className="mt-2">
                    <a
                      href="https://jp-clarinet.org/join/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-navy underline underline-offset-2 hover:text-gold"
                    >
                      入会はこちらから
                    </a>
                  </p>
                </div>
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
                  <FormLabel>伴奏者氏名*</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="伴奏者氏名"
                    />
                  </FormControl>
                  {category === "ジュニアA" ? (
                    <FormDescription>
                      ジュニアA部門に限り、ピアニストを委嘱することができます。委嘱をお願いする場合は、「ピアニスト希望」と書いてください。
                    </FormDescription>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />

            <section className="rounded-lg border border-border bg-muted/30 p-6">
              <p className="text-lg font-medium">
                参加費：{feeRaw != null ? (
                  <span className="text-gold">{feeRaw.toLocaleString()}円</span>
                ) : (
                  <span className="text-muted-foreground">部門・会員種別を選択してください</span>
                )}
              </p>
            </section>

            <div className="flex flex-wrap gap-4">
              <Button
                type="button"
                disabled={submitting || feeRaw == null}
                className="bg-gold text-gold-foreground hover:bg-gold-muted"
                onClick={async () => {
                  const valid = await form.trigger();
                  if (!valid || !competitionId) return;
                  setPortraitError(null);
                  setSubmitting(true);
                  setError(null);
                  try {
                    let portraitDataUrl = portraitDataUrlRef.current;
                    if (portraitFileRef.current) {
                      portraitDataUrl = await fileToPortraitDataUrl(portraitFileRef.current);
                      portraitDataUrlRef.current = portraitDataUrl;
                    }
                    if (!portraitDataUrl) {
                      setPortraitError("顔写真を選択してください。");
                      return;
                    }
                    const values = form.getValues();
                    saveYoung2026ApplyConfirmPayload({
                      competitionId,
                      name: values.name,
                      furigana: values.furigana,
                      email: values.email,
                      birth_date: values.birth_date,
                      affiliation: values.affiliation.trim(),
                      zip_code: values.zip_code.trim(),
                      address_prefecture: values.address_prefecture,
                      address_city: values.address_city.trim(),
                      address_street: values.address_street.trim(),
                      address_building: values.address_building?.trim() || "",
                      phone: values.phone.trim(),
                      portrait_data_url: portraitDataUrl,
                      member_type: values.member_type,
                      category: values.category,
                      selected_piece_preliminary: values.selected_piece_preliminary || null,
                      selected_piece_final:
                        values.category === "ジュニアB" || values.category === "ヤング"
                          ? values.selected_piece_final || null
                          : null,
                      video_url: YOUNG_2026.requiresVideo.includes(
                        values.category as "ジュニアA" | "ジュニアB"
                      )
                        ? values.video_url || null
                        : null,
                      accompanist_info: values.accompanist_info.trim(),
                    });
                    router.push("/events/young-2026/apply/confirm");
                  } catch (e) {
                    const msg =
                      e instanceof Error ? e.message : "顔写真の処理に失敗しました。";
                    setPortraitError(msg);
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {submitting ? "処理中..." : "確認する"}
              </Button>
              <Link href="/events/young-2026">
                <Button type="button" variant="outline">
                  キャンセル
                </Button>
              </Link>
            </div>
            {error && (
              <div
                className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
