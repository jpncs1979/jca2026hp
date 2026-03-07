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
import { competitions } from "@/data/competitions";

export const metadata = {
  title: "イベント・コンクール | 日本クラリネット協会",
  description: "日本クラリネット協会主催のコンクール・イベント一覧",
};

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
                <CardDescription>
                  {event.period}　{event.venue}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-6 text-muted-foreground">{event.description}</p>
                <div className="flex flex-wrap gap-3">
                  <Link href={event.href}>
                    <Button
                      variant={event.status === "申込受付中" ? "default" : "outline"}
                      className={event.status === "申込受付中" ? "bg-gold text-gold-foreground hover:bg-gold-muted" : ""}
                    >
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
      </div>
    </div>
  );
}
