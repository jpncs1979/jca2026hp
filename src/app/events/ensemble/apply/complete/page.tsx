"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { ENSEMBLE_2027 } from "@/lib/ensemble-2027";

function ApplyCompleteContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  if (sessionId) {
    return (
      <>
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700">
          <CheckCircle2 className="size-9" />
        </div>
        <h1 className="text-2xl font-bold text-navy md:text-3xl">お支払いが完了しました</h1>
        <p className="mt-4 text-muted-foreground">
          {ENSEMBLE_2027.name}へのお申し込みと、クレジットカードによる動画審査料のお支払いを確認しました。
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          登録内容の確認メールをお送りしています。予選動画は
          {ENSEMBLE_2027.videoSubmissionDeadline}までに提出してください（申込時にURLを入力していない場合）。
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-navy md:text-3xl">お手続きの確認</h1>
      <p className="mt-4 text-muted-foreground">
        通常は決済完了後、このページに自動で戻ります。
      </p>
    </>
  );
}

export default function EnsembleApplyCompletePage() {
  return (
    <div className="font-soft">
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <div className="text-center">
          <Suspense fallback={<p className="text-muted-foreground">読み込み中...</p>}>
            <ApplyCompleteContent />
          </Suspense>
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <Link href="/events/ensemble">
            <Button variant="outline">コンクール詳細に戻る</Button>
          </Link>
          <Link href="/">
            <Button className="bg-gold text-gold-foreground hover:bg-gold-muted">
              トップページへ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
