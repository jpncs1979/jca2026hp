import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, ArrowRight, Trophy } from "lucide-react";

export const metadata = {
  title: "イベント・コンクール | 日本クラリネット協会",
  description: "日本クラリネット協会主催のコンクール・イベント一覧",
};

const events = [
  {
    slug: "young-2026",
    title: "第15回ヤング・クラリネッティストコンクール",
    period: "2026年8月25日（火）～27日（木）",
    venue: "パルテノン多摩 小ホール（東京都多摩市）",
    description: "ジュニアA（13歳以下）、ジュニアB（17歳以下）、ヤング・アーティスト（20歳以下）。2026年4月1日時点の年齢でご応募ください。",
    href: "/events/young-2026",
    status: "申込受付中",
  },
  {
    slug: "festival-2029",
    title: "Road to 2029 国際フェスティバル",
    period: "2029年 開催予定",
    venue: "詳細未定",
    description: "2029年、世界が日本に響き合う。国際フェスティバルへの道のりを、随時お知らせします。",
    href: "/events/festival-2029",
    status: "準備中",
  },
];

export default function EventsPage() {
  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-navy md:text-4xl">
            <Calendar className="size-8 text-gold" />
            イベント・コンクール
          </h1>
          <p className="mt-2 text-muted-foreground">
            日本クラリネット協会主催のコンクール・イベント情報
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-8">
          {events.map((event) => (
            <Card key={event.slug}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-xl">{event.title}</CardTitle>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      event.status === "申込受付中"
                        ? "bg-gold/20 text-gold"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
                <CardDescription>
                  {event.period}　{event.venue}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-6 text-muted-foreground">{event.description}</p>
                <Link href={event.href}>
                  <Button
                    variant={event.status === "申込受付中" ? "default" : "outline"}
                    className={event.status === "申込受付中" ? "bg-gold text-gold-foreground hover:bg-gold-muted" : ""}
                  >
                    詳細を見る
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
