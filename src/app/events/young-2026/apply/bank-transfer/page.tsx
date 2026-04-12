"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { YOUNG_2026 } from "@/lib/young-2026";
import {
  clearYoung2026BankDraft,
  loadYoung2026BankDraft,
  type Young2026BankDraft,
} from "@/lib/young-2026-bank-draft";
import { Loader2 } from "lucide-react";

function BankTransferContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramId = searchParams.get("application_id")?.trim() ?? "";

  const [draft, setDraft] = useState<Young2026BankDraft | null>(null);
  const [applicationId, setApplicationId] = useState(paramId);
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const d = loadYoung2026BankDraft();
    setDraft(d);
    const aid = paramId || d?.applicationId || "";
    if (!aid) {
      router.replace("/events/young-2026/apply");
      return;
    }
    setApplicationId(aid);
    setEmail(d?.email ?? "");
  }, [paramId, router]);

  const displayAmount =
    draft?.amount != null
      ? draft.amount.toLocaleString("ja-JP") + "円"
      : "お申し込み時にメールでお知らせした金額（不明な場合は事務局へ）";
  const displayName = draft?.name ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!applicationId.trim()) {
      setError("申込IDがありません。お申し込み手続きからやり直してください。");
      return;
    }
    if (!email.trim()) {
      setError("申込時のメールアドレスを入力してください。");
      return;
    }
    if (!file) {
      setError("参加費振込の証明（領収書または振込明細など）の画像を選択してください。");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("application_id", applicationId.trim());
      fd.set("email", email.trim());
      fd.set("file", file);

      const res = await fetch("/api/events/young-2026/bank-transfer/receipt", {
        method: "POST",
        body: fd,
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; debug?: string };
      if (!res.ok) {
        const base = j.error ?? "アップロードに失敗しました。";
        setError(
          process.env.NODE_ENV === "development" && j.debug
            ? `${base}\n（開発用詳細: ${j.debug}）`
            : base
        );
        return;
      }
      clearYoung2026BankDraft();
      setDone(true);
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  };

  if (!done && !applicationId) {
    return <p className="text-muted-foreground">読み込み中…</p>;
  }

  if (done) {
    return (
      <>
        <h1 className="text-2xl font-bold text-navy md:text-3xl">
          参加費振込の証明画像を受け付けました
        </h1>
        <p className="mt-4 text-muted-foreground">
          事務局で入金を確認いたします。確認メールをお送りしている場合がありますので、受信トラブル時は迷惑メールフォルダもご確認ください。
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/events/young-2026">
            <Button variant="outline">コンクール詳細に戻る</Button>
          </Link>
          <Link href="/">
            <Button className="bg-gold text-gold-foreground hover:bg-gold-muted">トップページへ</Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-navy md:text-3xl">銀行振込・振込証明の送付</h1>
      <p className="mt-4 text-muted-foreground">
        {YOUNG_2026.name}の参加料（{displayAmount}）を、下記の口座へお振込みのうえ、
        <strong className="text-foreground">参加費のお振込が分かる証明（領収書または振込明細など）の画像</strong>
        を送付してください。
      </p>

      <div className="mt-10 space-y-8 text-left">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{YOUNG_2026.paymentMethod.postal.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>郵便振替番号：{YOUNG_2026.paymentMethod.postal.郵便振替番号}</p>
            <p>口座名：{YOUNG_2026.paymentMethod.postal.口座名}</p>
            <p className="text-muted-foreground">{YOUNG_2026.paymentMethod.postal.note}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{YOUNG_2026.paymentMethod.bank.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>金融機関：{YOUNG_2026.paymentMethod.bank.金融機関}</p>
            <p>店名：{YOUNG_2026.paymentMethod.bank.店名}</p>
            <p>種目：{YOUNG_2026.paymentMethod.bank.種目}</p>
            <p>口座番号：{YOUNG_2026.paymentMethod.bank.口座番号}</p>
            <p>口座名：{YOUNG_2026.paymentMethod.bank.口座名}</p>
            <p className="text-muted-foreground">{YOUNG_2026.paymentMethod.bank.note}</p>
          </CardContent>
        </Card>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {displayName ? (
            <p className="text-sm text-muted-foreground">
              お申込名：<span className="font-medium text-foreground">{displayName}</span>
            </p>
          ) : null}
          <div>
            <Label htmlFor="bank-email">申込時のメールアドレス *</Label>
            <Input
              id="bank-email"
              type="email"
              className="mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <Label htmlFor="bank-file">
              参加費振込の証明画像 *（領収書・振込明細など／JPEG / PNG / WebP、5MB以下）
            </Label>
            <Input
              id="bank-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="mt-1"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
          </div>
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <Button
            type="submit"
            disabled={submitting}
            className="bg-gold text-gold-foreground hover:bg-gold-muted"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                画像を送信中…
              </>
            ) : (
              "画像を送信する"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/events/young-2026" className="text-gold underline">
            コンクール詳細に戻る
          </Link>
        </p>
      </div>
    </>
  );
}

export default function Young2026BankTransferPage() {
  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-8 md:py-12">
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <Suspense fallback={<p className="text-muted-foreground">読み込み中…</p>}>
            <BankTransferContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
