import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Newspaper, Music2, ArrowRight, Globe } from "lucide-react";
import { supportedConcerts } from "@/data/supported-concerts";
import { SupportedConcertsCalendar } from "@/components/supported-concerts/SupportedConcertsCalendar";
import { SupportedConcertsMarquee } from "@/components/supported-concerts/SupportedConcertsMarquee";

export const metadata = {
  title: "ニュース | 日本クラリネット協会",
  description: "一般社団法人日本クラリネット協会からのお知らせ・会員後援演奏会",
};

export default async function NewsPage() {
  let newsItems: { id: string; title: string; content: string; publish_date: string; is_important: boolean }[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("news")
      .select("id, title, content, publish_date, is_important")
      .lte("publish_date", new Date().toISOString().slice(0, 10))
      .order("publish_date", { ascending: false })
      .limit(20);
    newsItems = data ?? [];
  }

  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-navy md:text-4xl">
            <Newspaper className="size-8 text-gold" />
            ニュース
          </h1>
          <p className="mt-2 text-muted-foreground">
            お知らせと会員後援演奏会のご案内
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-12">
          {/* 上：お知らせ */}
          <section>
            <h2 className="mb-6 text-xl font-semibold text-navy">お知らせ</h2>

            {/* 今ならICA会員になれるお知らせ（常時表示） */}
            <Card className="mb-6 overflow-hidden border-2 border-gold/40 bg-gradient-to-br from-gold/10 to-transparent">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gold/20">
                      <Globe className="size-6 text-gold" />
                    </div>
                    <div>
                      <p className="font-semibold text-navy">
                        今なら入会すると、<span className="text-gold">ICA（国際クラリネット協会）の会員にもなれます</span>
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        追加費用なし。世界最大のクラリネット組織の会員特典を、JCA会員の皆さまにお届けしています。
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link href="/membership/ica">
                      <Button variant="outline" size="sm" className="border-gold/50 text-gold hover:bg-gold/10">
                        詳細を見る
                      </Button>
                    </Link>
                    <Link href="/membership/join">
                      <Button size="sm" className="bg-gold text-gold-foreground hover:bg-gold-muted">
                        入会する
                        <ArrowRight className="ml-1 size-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {newsItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  現在、お知らせはありません。
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {newsItems.map((item) => (
                  <Card key={item.id} className={item.is_important ? "border-gold/50" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {item.publish_date.replace(/-/g, "/")}
                        </span>
                        {item.is_important && (
                          <span className="rounded bg-gold/20 px-2 py-0.5 text-xs font-medium text-gold">
                            重要
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-muted-foreground">{item.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* 下：会員後援演奏会（チラシ流し＋カレンダー＋一覧リンク） */}
          <section>
            <h2 className="mb-6 text-xl font-semibold text-navy">会員後援演奏会</h2>
            <Card className="overflow-hidden transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Music2 className="size-5 text-gold" />
                    <CardTitle className="text-xl">会員後援演奏会</CardTitle>
                  </div>
                  <Link href="/members/supported-concerts">
                    <Button variant="outline" size="sm" className="bg-gold/10 text-gold hover:bg-gold/20">
                      一覧・チラシを見る
                      <ArrowRight className="ml-1 size-4" />
                    </Button>
                  </Link>
                </div>
                <CardDescription>
                  協会が後援する会員主催の演奏会。カレンダーの日付または流れているチラシをクリックすると、各公演の詳細ページへ移動します。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <SupportedConcertsMarquee concerts={supportedConcerts} />
                <div>
                  <p className="mb-3 text-sm font-medium text-navy">公演日カレンダー</p>
                  <SupportedConcertsCalendar concerts={supportedConcerts} />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
