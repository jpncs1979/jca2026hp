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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FileUp } from "lucide-react";
import { flyerFileError } from "@/lib/patronage-concerts";

const formSchema = z.object({
  name: z.string().min(1, "お名前を入力してください"),
  email: z.string().min(1, "メールアドレスを入力してください").email("有効なメールアドレスを入力してください"),
  member_number: z.string().optional(),
  concert_title: z.string().min(1, "演奏会表題を入力してください"),
  event_date: z.string().min(1, "期日を入力してください"),
  doors_open: z.string().min(1, "開場時刻を入力してください"),
  curtain_time: z.string().min(1, "開演時刻を入力してください"),
  venue: z.string().min(1, "場所を入力してください"),
  admission: z.string().min(1, "入場料を入力してください"),
  performers: z.string().min(1, "出演者を入力してください"),
  program: z.string().min(1, "曲目を入力してください"),
  organizer: z.string().min(1, "主催を入力してください"),
  contact: z.string().min(1, "問い合わせ先を入力してください"),
  consent_destination: z.string().min(1, "承諾書の送り先を入力してください"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const REQUIRED_MARK = "※";

export default function PatronageRequestPage() {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [flyerError, setFlyerError] = useState<string | null>(null);
  const [submittedWithoutFlyer, setSubmittedWithoutFlyer] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      member_number: "",
      concert_title: "",
      event_date: "",
      doors_open: "",
      curtain_time: "",
      venue: "",
      admission: "",
      performers: "",
      program: "",
      organizer: "",
      contact: "",
      consent_destination: "",
      notes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (flyerFile) {
      const err = flyerFileError(flyerFile);
      if (err) {
        setFlyerError(err);
        return;
      }
    }
    setFlyerError(null);
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (v != null && v !== "") formData.append(k, String(v));
      });
      if (flyerFile) formData.append("flyer", flyerFile);
      const res = await fetch("/api/membership/patronage-request", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMessage(data.error ?? "送信に失敗しました。しばらくしてからお試しください。");
        return;
      }
      setSubmittedWithoutFlyer(!flyerFile);
      setSuccess(true);
    } catch (e) {
      console.error(e);
      setErrorMessage("送信に失敗しました。しばらくしてからお試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="font-soft">
        <div className="border-b border-border bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold text-navy md:text-4xl">後援依頼の申し込み</h1>
          </div>
        </div>
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="text-gold">送信が完了しました</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  後援依頼を送信しました。事務局が承認すると、演奏会情報が
                  <Link href="/members/supported-concerts" className="mx-1 text-gold underline-offset-2 hover:underline">
                    後援演奏会のご案内
                  </Link>
                  に掲載されます。
                  {submittedWithoutFlyer
                    ? "チラシはできあがり次第、事務局へお送りください。届き次第、案内ページに追加します。"
                    : "添付いただいたチラシも、承認後に案内ページへ掲載します。"}
                  承諾書は別途お送りします。
                </p>
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
          <h1 className="text-3xl font-bold text-navy md:text-4xl">後援依頼の申し込み</h1>
          <p className="mt-2 text-muted-foreground">
            後援演奏会の後援をご希望の方は、下記フォームからお申し込みください。
            事務局が承認すると、演奏会情報が後援演奏会のご案内ページに掲載されます。
            チラシは申請時にあれば一緒に、まだできていなければ後から事務局へお送りください。
          </p>
          <p className="mt-1 text-sm text-muted-foreground">（{REQUIRED_MARK}は必須項目）</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">後援依頼フォーム</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {errorMessage && (
                    <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {errorMessage}
                    </p>
                  )}

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{REQUIRED_MARK} お名前</FormLabel>
                        <FormControl>
                          <Input placeholder="氏名" {...field} />
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
                        <FormLabel>{REQUIRED_MARK} メールアドレス</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="example@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="member_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>会員番号（日本クラリネット協会会員の方）</FormLabel>
                        <FormControl>
                          <Input placeholder="例: 0001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="concert_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{REQUIRED_MARK} 演奏会表題</FormLabel>
                        <FormControl>
                          <Input placeholder="演奏会の表題" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="event_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{REQUIRED_MARK} 期日</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          複数日にわたる場合は初日を選択し、2日目以降は備考欄へご記入ください。
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="doors_open"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{REQUIRED_MARK} 開場時刻</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="curtain_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{REQUIRED_MARK} 開演時刻</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="venue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{REQUIRED_MARK} 場所</FormLabel>
                        <FormControl>
                          <Input placeholder="会場名・住所" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="admission"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{REQUIRED_MARK} 入場料</FormLabel>
                        <FormControl>
                          <Input placeholder="例：A席：3,000円、B席：2,000円" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="performers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{REQUIRED_MARK} 出演者</FormLabel>
                        <FormControl>
                          <Textarea placeholder="出演者名" className="min-h-[80px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="program"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{REQUIRED_MARK} 曲目</FormLabel>
                        <FormControl>
                          <Textarea placeholder="曲目" className="min-h-[80px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="organizer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{REQUIRED_MARK} 主催</FormLabel>
                        <FormControl>
                          <Input placeholder="主催者名" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{REQUIRED_MARK} 問い合わせ先</FormLabel>
                        <FormControl>
                          <Input placeholder="電話番号・メールアドレスなど" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="consent_destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{REQUIRED_MARK} 承諾書の送り先</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="〒・住所・宛先、またはFAXを希望の場合FAX番号"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>備考</FormLabel>
                        <FormControl>
                          <Textarea placeholder="期日の2日目以降、その他" className="min-h-[60px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      チラシデータ（任意）
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        className="text-sm text-muted-foreground file:mr-2 file:rounded file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-gold-foreground file:hover:bg-gold-muted"
                        onChange={(e) => {
                          setFlyerFile(e.target.files?.[0] ?? null);
                          setFlyerError(null);
                        }}
                      />
                      {flyerFile && (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <FileUp className="size-4" />
                          {flyerFile.name}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      まだできていない場合は、空欄のまま送信できます。できあがり次第、事務局へお送りください。
                      PDF または JPEG / PNG（4MB 以下）。画像のチラシは、承認後に案内ページの流れる一覧へ公演日順で掲載されます。
                    </p>
                    {flyerError && <p className="mt-1 text-sm text-destructive">{flyerError}</p>}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button type="submit" disabled={submitting} className="bg-gold text-gold-foreground hover:bg-gold-muted">
                      {submitting ? "送信中..." : "送信する"}
                    </Button>
                    <Link href="/">
                      <Button type="button" variant="outline">キャンセル</Button>
                    </Link>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
