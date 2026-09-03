import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, ArrowRight, Trophy, Music, ExternalLink } from "lucide-react";
import { competitions } from "@/data/competitions";
import { FESTIVAL_39_HIROSHIMA_OFFICIAL_URL } from "@/lib/festival-2027-hiroshima";

export const metadata = {
  title: "コンクール・イベント | 日本クラリネット協会",
  description: "日本クラリネット協会主催のコンクール・イベント一覧",
};

export default function EventsPage() {
  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-navy md:text-4xl">
            <Calendar className="size-8 text-gold" />
            コンクール・イベント
          </h1>
          <p className="mt-2 text-muted-foreground">
            日本クラリネット協会主催のコンクール・イベント情報
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-16">
          {/* ページ内ナビ */}
          <nav className="flex flex-wrap gap-2 border-b border-border pb-6">
            <a href="#concours" className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-navy">
              コンクール
            </a>
            <a href="#events" className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-navy">
              フェスティバル
            </a>
          </nav>

          {/* コンクール */}
          <section id="concours" className="scroll-mt-24">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Trophy className="size-5 text-gold" />
              コンクール
            </h2>
            <div className="space-y-6">
              {competitions.map((event) => (
                <Card key={event.slug}>
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="text-xl">{event.title}</CardTitle>
                      <span
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          event.status === "申込受付中"
                            ? "bg-gold/20 text-gold"
                            : event.status === "準備中"
                              ? "bg-muted text-muted-foreground"
                              : "bg-navy/10 text-navy"
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>
                    <CardDescription className="space-y-1">
                      <span className="block">
                        {event.period}　{event.venue}
                      </span>
                      {event.applicationPeriod ? (
                        <span className="block font-medium text-navy/90">
                          申込期間：{event.applicationPeriod}
                        </span>
                      ) : null}
                      {event.videoSubmissionDeadline ? (
                        <span className="block font-medium text-navy/90">
                          予選動画提出：{event.videoSubmissionDeadline}まで
                        </span>
                      ) : null}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-6 text-muted-foreground">{event.description}</p>
                    <div className="flex flex-wrap gap-3">
                      {event.status === "申込受付中" && event.applyHref ? (
                        <Link href={event.applyHref}>
                          <Button className="bg-gold text-gold-foreground hover:bg-gold-muted">
                            参加申込
                            <ArrowRight className="ml-2 size-4" />
                          </Button>
                        </Link>
                      ) : null}
                      {event.resultsHref ? (
                        <Link href={event.resultsHref}>
                          <Button className="bg-gold text-gold-foreground hover:bg-gold-muted">
                            結果発表
                            <ArrowRight className="ml-2 size-4" />
                          </Button>
                        </Link>
                      ) : null}
                      <Link href={event.href}>
                        <Button variant="outline">
                          詳細を見る
                          <ArrowRight className="ml-2 size-4" />
                        </Button>
                      </Link>
                      {event.archiveHref && (
                        <Link href={event.archiveHref}>
                          <Button variant="ghost" size="sm">
                            過去の受賞者
                            <ArrowRight className="ml-1 size-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* フェスティバル */}
          <section id="events" className="scroll-mt-24">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium text-navy">
              <Music className="size-5 text-gold" />
              フェスティバル
            </h2>
            <div className="space-y-6">
              {/* 第39回日本クラリネットフェスティバル（広島） */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">第３９回日本クラリネットフェスティバル in 広島</CardTitle>
                  <CardDescription>
                    2027年2月28日（日）（予定）。詳細は
                    <a
                      href={FESTIVAL_39_HIROSHIMA_OFFICIAL_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold hover:underline"
                    >
                      公式案内サイト
                    </a>
                    をご覧ください。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <a
                    href={FESTIVAL_39_HIROSHIMA_OFFICIAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="bg-gold text-gold-foreground hover:bg-gold-muted">
                      公式案内サイト
                      <ExternalLink className="ml-2 size-4" />
                    </Button>
                  </a>
                </CardContent>
              </Card>

              {/* 国際フェスティバル2029 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Road to 2029 国際フェスティバル</CardTitle>
                  <CardDescription>
                    2029年、世界が日本に響き合う。クラリネットの国際的な祭典を目指して準備を進めています。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/events/festival-2029">
                    <Button variant="outline">
                      最新情報を見る
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
