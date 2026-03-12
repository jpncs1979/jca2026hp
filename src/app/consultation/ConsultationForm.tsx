"use client";

import { useState } from "react";
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

const schema = z.object({
  name: z.string().min(1, "氏名を入力してください"),
  email: z.string().min(1, "メールアドレスを入力してください").email("有効なメールアドレスを入力してください"),
  nickname: z.string().optional(),
  age: z
    .union([z.enum(["小学生", "中学生", "高校生"]), z.literal("")])
    .refine((v) => v !== "", "年齢を選択してください"),
  category: z.string().min(1, "質問の内容を選択してください"),
  body: z.string().optional(),
});

type FormValues = z.input<typeof schema>;

export function ConsultationForm() {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      nickname: "",
      age: "",
      category: "",
      body: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          nickname: values.nickname || undefined,
          age: values.age || undefined,
          category: values.category,
          body: values.body || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
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
            ご質問ありがとうございます。事務局にて確認のうえ、回答いたします。質問と回答は選択してHPに公開することがあります。
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => setSuccess(false)}
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>氏名 *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="氏名" />
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
                    <Input {...field} type="email" placeholder="example@email.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ニックネーム</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="公開時にニックネームで表示する場合" />
                  </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />
            {errorMessage && (
              <p className="text-sm text-destructive">{errorMessage}</p>
            )}
            <Button type="submit" disabled={submitting} className="bg-gold text-gold-foreground hover:bg-gold-muted">
              {submitting ? "送信中…" : "送信する"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
