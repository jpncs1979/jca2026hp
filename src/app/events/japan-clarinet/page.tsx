import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Trophy, ArrowRight } from "lucide-react";

export const metadata = {
  title: "日本クラリネットコンクール | 日本クラリネット協会",
  description:
    "4年に1度開催される日本クラリネット協会のフラッグシップコンクール。クラリネットの最高峰を目指す若手奏者の登竜門。",
};

export default function JapanClarinetPage() {
  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-navy md:text-4xl">
            <Trophy className="size-8 text-gold" />
            日本クラリネットコンクール
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            4年に1度開催される日本クラリネット協会のフラッグシップコンクール
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/archive?competition=japan-clarinet">
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
              日本クラリネットコンクールは、日本クラリネット協会が4年に1度開催するフラッグシップコンクールです。
              クラリネットの最高峰を目指す若手奏者の登竜門として、多くの優秀な演奏家を輩出してきました。
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-medium text-navy">開催概要</h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">開催周期</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <p className="flex items-center gap-2">
                  <Calendar className="size-4 text-gold" />
                  4年に1度開催
                </p>
                <p className="text-sm text-muted-foreground">
                  次回開催時期は決まり次第、当サイトおよびニュースでお知らせします。
                </p>
              </CardContent>
            </Card>
          </section>

          <div className="border-t border-border pt-12">
            <Link href="/archive?competition=japan-clarinet">
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
