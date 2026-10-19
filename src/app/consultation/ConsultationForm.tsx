"use client";

import { useRef, useState } from "react";
import { TurnstileField, turnstileSiteKey } from "@/components/TurnstileField";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const CATEGORIES = [
  "音が出ない、どうして？どうしよう",
  "リードはどうしたらよいの？",
  "奏法について（アンブシュア、呼吸）",
  "楽器について",
  "特殊管について",
  "その他",
] as const;

const AGES = ["小学生", "中学生", "高校生"] as const;

const schema = z
  .object({
    name: z.string().min(1, "氏名を入力してください"),
    email: z.string().min(1, "メールアドレスを入力してください").email("有効なメールアドレスを入力してください"),
    publicName: z.string().max(80, "80文字以内で入力してください"),
    age: z
      .union([z.enum(["小学生", "中学生", "高校生"]), z.literal("")])
      .refine((v) => v !== "", "年齢を選択してください"),
    category: z.string().min(1, "質問の内容を選択してください"),
    body: z.string().max(15_000, "15,000文字以内で入力してください"),
    publishWanted: z.boolean(),
  })
  .refine((values) => !values.publishWanted || values.publicName.trim().length > 0, {
    message: "HPに掲載する場合は、掲載時のお名前を入力してください",
    path: ["publicName"],
  });

type FormValues = z.input<typeof schema>;

export function ConsultationForm() {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileEpoch, setTurnstileEpoch] = useState(0);
  const startedAtRef = useRef(Date.now());
  const honeypotRef = useRef<HTMLInputElement>(null);
  const turnstileEnabled = Boolean(turnstileSiteKey());

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      publicName: "",
      age: "",
      category: "",
      body: "",
      publishWanted: false,
    },
  });

  const resetTurnstile = () => {
    setTurnstileToken("");
    setTurnstileEpoch((n) => n + 1);
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setErrorMessage(null);
    if (turnstileEnabled && !turnstileToken) {
      setErrorMessage("確認が終わっていません。少し待ってからもう一度送信してください。");
      setSubmitting(false);
      return;
    }
    try {
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          publicName: values.publicName.trim() || undefined,
          age: values.age || undefined,
          category: values.category,
          body: values.body || undefined,
          publishWanted: values.publishWanted,
          company_website: honeypotRef.current?.value ?? "",
          startedAt: startedAtRef.current,
          turnstileToken,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        resetTurnstile();
        setErrorMessage(data.error ?? "送信に失敗しました。しばらくしてからお試しください。");
        return;
      }
      setSuccess(true);
      form.reset();
    } catch {
      setErrorMessage("送信に失敗しました。しばらくしてからお試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gold font-medium">送信が完了しました</p>
          <p className="mt-2 text-sm text-muted-foreground">
            ご質問ありがとうございます。回答はメールでお送りします。掲載を希望された場合は、掲載前に確認のメールをお送りします。
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => {
              startedAtRef.current = Date.now();
              resetTurnstile();
              setSuccess(false);
            }}
          >
            もう一度質問する
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="relative space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>氏名（本名） *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="氏名" autoComplete="name" />
                  </FormControl>
                  <FormDescription>HPには掲載しません</FormDescription>
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
                    <Input {...field} type="email" placeholder="example@email.com" autoComplete="email" />
                  </FormControl>
                  <FormDescription>回答はこのアドレスにお送りします。HPには掲載しません</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="publicName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>HP掲載時のお名前（ハンドルネーム）</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="例：クラ吹きの中2" maxLength={80} />
                  </FormControl>
                  <FormDescription>
                    HPに掲載するときは、ここに書いた内容だけを載せます。本名・学校名など、個人が分かる情報は書かないでください。掲載に同意する場合は必須です。
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>年齢 *</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">選択してください</option>
                      {AGES.map((a) => (
                        <option key={a} value={a}>
                          {a}
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>質問の内容を選択ください *</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">選択してください</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
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
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>質問の詳細（任意）</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} placeholder="具体的な状況や補足があればご記入ください" />
                  </FormControl>
                  <FormDescription>
                    HPに掲載する場合も、本名や学校名は載せません。文面は事務局で整えることがあります
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="publishWanted"
              render={({ field }) => (
                <FormItem>
                  <label className="flex items-start gap-3 text-sm leading-relaxed">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      name={field.name}
                      className="mt-0.5"
                    />
                    <span>
                      回答をHPの相談室に掲載してもかまいません（掲載前に、掲載する文面をメールで確認していただきます）
                    </span>
                  </label>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                width: 1,
                height: 1,
                padding: 0,
                margin: -1,
                overflow: "hidden",
                clip: "rect(0, 0, 0, 0)",
                whiteSpace: "nowrap",
                border: 0,
              }}
            >
              <label htmlFor="company_website">Company website</label>
              <input
                ref={honeypotRef}
                id="company_website"
                name="company_website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                defaultValue=""
              />
            </div>
            <TurnstileField key={turnstileEpoch} onToken={setTurnstileToken} language="ja" />
            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
            <Button type="submit" disabled={submitting} className="bg-gold text-gold-foreground hover:bg-gold-muted">
              {submitting ? "送信中…" : "送信する"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
