"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

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
          第15回ヤング・クラリネッティストコンクールへのお申し込みと、クレジットカードによるお支払いを確認しました。
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          登録内容の確認メールをお送りしています。届かない場合は迷惑メールフォルダもご確認ください。反映まで数分かかる場合があります。
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-navy md:text-3xl">お手続きの確認</h1>
      <p className="mt-4 text-muted-foreground">
        通常は決済完了後、このページに自動で戻ります。お心当たりがない場合はトップまたはコンクールページから再度お申し込みください。
      </p>
    </>
  );
}

export default function ApplyCompletePage() {
  return (
    <div className="font-soft">
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <div className="text-center">
          <Suspense
            fallback={<p className="text-muted-foreground">読み込み中...</p>}
          >
            <ApplyCompleteContent />
          </Suspense>
        </div>

        <div className="mt-12 space-y-4 text-center">
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/events/young-2026">
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
    </div>
  );
}
