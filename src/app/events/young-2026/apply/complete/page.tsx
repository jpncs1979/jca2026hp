import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function ApplyCompletePage() {
  return (
    <div className="font-soft">
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-navy md:text-3xl">
            申込を受け付けました
          </h1>
          <p className="mt-4 text-muted-foreground">
            第15回ヤング・クラリネッティストコンクールへのお申し込みありがとうございます。
          </p>
        </div>

        {/* 銀行振込時の注意喚起 */}
        <div className="mt-12 rounded-xl border-2 border-gold bg-gold/10 p-6 md:p-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="size-8 shrink-0 text-gold" />
            <div>
              <h2 className="text-xl font-bold text-navy">
                銀行振込時の重要なお知らせ
              </h2>
              <p className="mt-4 text-2xl font-bold text-gold md:text-3xl">
                振込依頼人名の前に
                <br />
                「ヤング」をつけてください
              </p>
              <p className="mt-4 text-muted-foreground">
                例：山田太郎 → <strong className="text-foreground">ヤング</strong>山田太郎
              </p>
              <p className="mt-6 text-sm text-muted-foreground">
                振込先口座など、お支払いの詳細は追ってメールにてご案内いたします。
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            申込確認メールをお送りしました。届いていない場合は迷惑メールフォルダをご確認ください。
          </p>
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
