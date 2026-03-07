import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Music2, ArrowRight } from "lucide-react";

export const metadata = {
  title: "クラリネット・アンサンブルコンクール | 日本クラリネット協会",
  description:
    "クラリネット重奏の祭典。アンサンブルの魅力を追求する日本クラリネット協会主催のコンクール。",
};

export default function EnsemblePage() {
  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-navy md:text-4xl">
            <Music2 className="size-8 text-gold" />
            クラリネット・アンサンブルコンクール
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            重奏の祭典
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/archive?competition=ensemble">
              <Button variant="outline" size="lg">
                過去の受賞者
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-12">
          <section>
            <h2 className="mb-4 text-xl font-medium text-navy">概要</h2>
            <p className="leading-relaxed text-muted-foreground">
              クラリネット・アンサンブルコンクールは、クラリネット重奏の魅力を追求するコンクールです。
              デュオ、トリオ、カルテットなど、さまざまな編成でアンサンブルの醍醐味を競い合います。
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-medium text-navy">開催概要</h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">開催情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <p className="flex items-center gap-2">
                  <Calendar className="size-4 text-gold" />
                  開催時期・会場は決まり次第お知らせします
                </p>
                <p className="text-sm text-muted-foreground">
                  詳細が決まり次第、当サイトおよびニュースでお知らせします。
                </p>
              </CardContent>
            </Card>
          </section>

          <div className="border-t border-border pt-12">
            <Link href="/archive?competition=ensemble">
              <Button variant="outline">
                過去の受賞者アーカイブを見る
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
