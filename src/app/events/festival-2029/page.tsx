import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Music } from "lucide-react";

export const metadata = {
  title: "Road to 2029 国際フェスティバル | 日本クラリネット協会",
  description: "2029年開催予定の国際フェスティバル。世界が日本に響き合うクラリネットの祭典へ。",
};

export default function Festival2029Page() {
  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-navy md:text-4xl">
            <Music className="size-8 text-gold" />
            Road to 2029 国際フェスティバル
          </h1>
          <p className="mt-2 text-muted-foreground">
            2029年、世界が日本に響き合う。
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                2029年を目指し、日本クラリネット協会では国際フェスティバルの開催を準備しています。
                世界中のクラリネット奏者が一堂に会し、演奏・交流・学びの場となることを目指しています。
              </p>
              <p className="mt-4 text-muted-foreground">
                開催日時・会場・参加方法など、詳細が決まり次第、本ページおよびニュースでお知らせいたします。
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-4">
            <Link href="/events">
              <Button variant="outline">イベント一覧に戻る</Button>
            </Link>
            <Link href="/#news">
              <Button className="bg-gold text-gold-foreground hover:bg-gold-muted">
                トップのお知らせを見る
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
