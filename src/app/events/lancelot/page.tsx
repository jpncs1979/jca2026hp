import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Calendar,
  ExternalLink,
  Globe,
  Trophy,
} from "lucide-react";
import { LANCELOT_COMPETITION } from "@/lib/lancelot-2027";

export const metadata = {
  title: `${LANCELOT_COMPETITION.name} | 日本クラリネット協会`,
  description:
    "日本開催は4年に一度。一般社団法人日本クラリネット協会が主催する国際クラリネットコンクール。開催概要を公開しました。",
};

export default function LancelotPage() {
  return (
    <div className="font-soft">
      <div className="relative overflow-hidden bg-navy py-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_70%_0%,rgba(201,162,39,0.18),transparent)]" />
        <div className="container relative mx-auto px-4">
          <p className="mb-3 text-sm font-medium tracking-[0.28em] text-gold">
            EVERY FOUR YEARS
          </p>
          <p className="mb-2 text-sm font-medium text-gold/90">
            {LANCELOT_COMPETITION.editionLabel}　{LANCELOT_COMPETITION.cycleNote}
          </p>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight text-white md:text-5xl">
            {LANCELOT_COMPETITION.name}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90 md:text-xl">
            一般社団法人日本クラリネット協会が主催します。開催概要を公開しました。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={LANCELOT_COMPETITION.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                className="bg-gold text-gold-foreground hover:bg-gold-muted"
              >
                開催概要（公式サイト）
                <ExternalLink className="ml-2 size-4" />
              </Button>
            </a>
            <Link href="/events#concours">
              <Button
                size="lg"
                variant="outline"
                className="border-gold/60 bg-transparent text-gold hover:bg-gold hover:text-navy"
              >
                コンクール一覧
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-12">
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-medium text-navy">
              <Trophy className="size-5 text-gold" />
              お知らせ
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              日仏で交互に開催される国際コンクールのうち、日本開催は4年に一度の大きな祭典です。
              次回は{LANCELOT_COMPETITION.organiser}が主催し、世界から集う若き奏者たちの舞台となります。
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-medium text-navy">開催概要</h2>
            <Card className="border-gold/30">
              <CardHeader>
                <CardTitle className="text-base">公開中の概要</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <p className="flex items-start gap-2">
                  <Trophy className="mt-0.5 size-4 shrink-0 text-gold" />
                  <span>
                    <span className="font-medium text-navy">主催</span>
                    <br />
                    {LANCELOT_COMPETITION.organiser}
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <Calendar className="mt-0.5 size-4 shrink-0 text-gold" />
                  <span>
                    <span className="font-medium text-navy">開催周期</span>
                    <br />
                    {LANCELOT_COMPETITION.cycleNote}（2年ごとに日本とフランスで交互開催）
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <Globe className="mt-0.5 size-4 shrink-0 text-gold" />
                  <span>
                    <span className="font-medium text-navy">次回日本開催</span>
                    <br />
                    {LANCELOT_COMPETITION.period}　開催地：{LANCELOT_COMPETITION.venue}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  日程・会場・参加方法など、最新の開催概要は公式サイトをご覧ください。
                </p>
              </CardContent>
            </Card>
          </section>

          <div className="flex flex-wrap gap-3 border-t border-border pt-10">
            <a
              href={LANCELOT_COMPETITION.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-gold text-gold-foreground hover:bg-gold-muted">
                公式サイトで概要を見る
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </a>
            <Link href="/#news">
              <Button variant="outline">トップのお知らせへ</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
