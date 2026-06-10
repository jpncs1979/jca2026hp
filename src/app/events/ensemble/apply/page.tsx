"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ENSEMBLE_2027 } from "@/lib/ensemble-2027";
import { supabase } from "@/lib/supabase";
import {
  ensemble2027ApplyFeeYen,
  isRestorableEnsemble2027ApplyPayload,
  loadEnsemble2027ApplyConfirmPayload,
  saveEnsemble2027ApplyConfirmPayload,
} from "@/lib/ensemble-2027-apply-confirm";

const formSchema = z.object({
  name: z.string().min(1, "団体名を入力してください"),
  furigana: z.string().min(1, "団体名のふりがなを入力してください"),
  representative_name: z.string().min(1, "代表者氏名を入力してください"),
  birth_date: z.string().min(1, "代表者の生年月日を入力してください"),
  email: z.string().min(1, "メールアドレスを入力してください").email("有効なメールアドレスを入力してください"),
  phone: z.string().min(1, "電話番号を入力してください"),
  member_type: z.enum(["会員", "非会員"]),
  member_number: z.string().optional(),
  category: z.enum(["小・中学生部門", "高校生部門", "専門部門", "一般部門"]),
  program_title: z.string().min(1, "演奏曲名を入力してください"),
  ensemble_details: z.string().min(1, "団体人数・メンバー名簿等を入力してください"),
  video_url: z.string().optional(),
}).refine((data) => {
  if (data.member_type === "会員" && !data.member_number?.trim()) return false;
  return true;
}, {
  message: "会員価格の場合は会員番号を入力してください",
  path: ["member_number"],
});

type FormValues = z.infer<typeof formSchema>;

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

  return (
    <div className="flex items-center gap-1">
      <Input
        ref={yearRef}
        type="text"
        inputMode="numeric"
        placeholder="yyyy"
        maxLength={4}
        value={local.year}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "").slice(0, 4);
          commit(v, local.month, local.day);
          if (v.length === 4) monthRef.current?.focus();
        }}
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
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "").slice(0, 2);
          commit(local.year, v, local.day);
          if (v.length === 2) dayRef.current?.focus();
        }}
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
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "").slice(0, 2);
          commit(local.year, local.month, v);
        }}
        onBlur={onBlur}
        disabled={disabled}
        className="w-14 text-center"
      />
    </div>
  );
}

export default function EnsembleApplyPage() {
  const router = useRouter();
  const draftHydratedRef = useRef(false);
  const [gateLoading, setGateLoading] = useState(true);
  const [competitionId, setCompetitionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const applicationOpen = periodOpen || isAdmin;
  const adminTestMode = isAdmin && !periodOpen;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      furigana: "",
      representative_name: "",
      birth_date: "",
      email: "",
      phone: "",
      member_type: "非会員",
      member_number: "",
      category: "小・中学生部門",
      program_title: "",
      ensemble_details: "",
      video_url: "",
    },
  });

  const memberType = form.watch("member_type");
  const category = form.watch("category");
  const feeRaw = ensemble2027ApplyFeeYen(category, memberType);

  useEffect(() => {
    fetch(`/api/events/competition-gate?slug=${ENSEMBLE_2027.slug}`, {
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

  useEffect(() => {
    if (gateLoading || !competitionId || draftHydratedRef.current) return;
    const raw = loadEnsemble2027ApplyConfirmPayload();
    if (!raw || raw.competitionId !== competitionId || !isRestorableEnsemble2027ApplyPayload(raw)) {
      return;
    }
    form.reset({
      name: raw.name,
      furigana: raw.furigana,
      representative_name: raw.representative_name,
      birth_date: raw.birth_date,
      email: raw.email,
      phone: raw.phone,
      member_type: raw.member_type,
      member_number: raw.member_number ?? "",
      category: raw.category,
      program_title: raw.program_title,
      ensemble_details: raw.ensemble_details,
      video_url: raw.video_url ?? "",
    });
    draftHydratedRef.current = true;
  }, [gateLoading, competitionId, form]);

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
          Supabaseの環境変数が設定されていません。
        </p>
        <div className="mt-4 text-center">
          <Link href="/events/ensemble">
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
          申込の準備ができていません。competitions テーブルに {ENSEMBLE_2027.slug} が登録されているか確認してください。
        </p>
        <div className="mt-4 text-center">
          <Link href="/events/ensemble">
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
            申込受付期間は {ENSEMBLE_2027.applicationPeriod} です。
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            予選動画の提出期限は {ENSEMBLE_2027.videoSubmissionDeadline} まで（申込完了後に提出可能）です。
          </p>
          <Link href="/events/ensemble" className="mt-8 inline-block">
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
            {ENSEMBLE_2027.name} 参加申込
          </h1>
          <p className="mt-2 text-muted-foreground">
            申込：{ENSEMBLE_2027.applicationPeriod}／動画提出：{ENSEMBLE_2027.videoSubmissionDeadline}まで
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            動画審査料のお支払いは<strong className="text-foreground">クレジットカードのみ</strong>です。
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
          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
            <section className="space-y-4">
              <h2 className="text-lg font-medium text-navy">団体情報</h2>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>団体名 *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="○○○クラリネットアンサンブル" />
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
                    <FormLabel>団体名ふりがな *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="○○○くらりねっとあんさんぶる" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>部門 *</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                      >
                        {ENSEMBLE_2027.categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}（{c.pieceLimit}）
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="program_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>演奏曲名 *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="曲目・編曲者など" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ensemble_details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>団体人数・メンバー名簿 *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={4}
                        placeholder="団体人数、メンバー氏名（パート）など"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-medium text-navy">代表者・連絡先</h2>
              <FormField
                control={form.control}
                name="representative_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>代表者氏名 *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="山田 太郎" />
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
                    <FormLabel>代表者生年月日 *</FormLabel>
                    <FormControl>
                      <BirthDateInput
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormDescription>
                      会員価格でお申し込みの場合、会員データと照合します。
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
                    <FormLabel>代表者メールアドレス *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} placeholder="example@email.com" />
                    </FormControl>
                    <FormDescription>
                      協会からの連絡（{ENSEMBLE_2027.officeEmail}）を受信できる設定にしてください。
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
                    <FormLabel>電話番号 *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="090-1234-5678" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-medium text-navy">会員種別（審査料）</h2>
              <FormField
                control={form.control}
                name="member_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>会員種別 *</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                      >
                        <option value="非会員">非会員</option>
                        <option value="会員">会員（演奏者に1名以上会員が含まれる団体）</option>
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
                      <FormLabel>会員番号（4桁）*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="例: 0001" />
                      </FormControl>
                      <FormDescription>
                        会員番号・メール・代表者生年月日が会員データと一致している必要があります。
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-medium text-navy">予選動画（任意）</h2>
              <FormField
                control={form.control}
                name="video_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube 限定公開 URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." />
                    </FormControl>
                    <FormDescription>
                      申込時点で未準備の場合は空欄でも構いません。{ENSEMBLE_2027.videoSubmissionDeadline}までに提出してください。
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <section className="rounded-lg border border-border bg-muted/30 p-6 space-y-2">
              <p className="text-lg font-medium">
                お支払い（動画審査料・1団体）：
                {feeRaw != null ? (
                  <span className="text-gold">{feeRaw.toLocaleString()}円</span>
                ) : (
                  <span className="text-muted-foreground">部門・会員種別を選択してください</span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                クレジットカード（Stripe）で決済します。予選通過後の本選参加料（演奏者1人につき）は、通過のご連絡後に別途お支払いいただきます。
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
                  const values = form.getValues();
                  setSubmitting(true);
                  setError(null);
                  try {
                    if (values.member_type === "会員") {
                      const vRes = await fetch("/api/events/ensemble-2027/verify-member", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          member_number: values.member_number,
                          email: values.email,
                          birth_date: values.birth_date,
                        }),
                      });
                      const vJson = await vRes.json().catch(() => ({}));
                      if (!vRes.ok) {
                        setError(
                          (vJson as { error?: string }).error ??
                            "会員情報の確認に失敗しました。"
                        );
                        return;
                      }
                    }
                    saveEnsemble2027ApplyConfirmPayload({
                      competitionId,
                      name: values.name,
                      furigana: values.furigana,
                      representative_name: values.representative_name,
                      birth_date: values.birth_date,
                      email: values.email,
                      phone: values.phone,
                      member_type: values.member_type,
                      member_number: values.member_number?.trim() || undefined,
                      category: values.category,
                      program_title: values.program_title,
                      ensemble_details: values.ensemble_details,
                      video_url: values.video_url?.trim() || null,
                    });
                    router.push("/events/ensemble/apply/confirm");
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {submitting ? "処理中..." : "確認する"}
              </Button>
              <Link href="/events/ensemble">
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
