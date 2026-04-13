import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Music } from "lucide-react";

export const metadata = {
  title: "第３９回日本クラリネットフェスティバル in 広島 | 日本クラリネット協会",
  description: "2027年2月28日（日）、広島で開催予定の第39回日本クラリネットフェスティバル（詳細は後日公開）。",
};

export default function Festival2027Page() {
  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-navy md:text-4xl">
            <Music className="size-8 text-gold" />
            第３９回日本クラリネットフェスティバル in 広島
          </h1>
          <p className="mt-2 flex items-center gap-2 text-muted-foreground">
            <Calendar className="size-5 text-gold" />
            2027年2月28日（日）（予定）
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                本ページでは、第３９回日本クラリネットフェスティバル in 広島の開催案内を掲載します。
                開催内容、会場、参加方法などの詳細は準備が整い次第、順次公開いたします。
              </p>
              <p className="mt-4 text-muted-foreground">
                なお、ご相談は `ヘッダーの相談室` からお願いいたします。その他のお問い合わせは `お問い合わせ` ページをご利用ください。
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-4">
            <Link href="/events">
              <Button variant="outline">イベント一覧に戻る</Button>
            </Link>
            <Link href="/consultation">
              <Button className="bg-gold text-gold-foreground hover:bg-gold-muted">
                相談室へ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

