import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Newspaper, Music2, ArrowRight } from "lucide-react";

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

          {/* 下：会員後援演奏会（リンク） */}
          <section>
            <h2 className="mb-6 text-xl font-semibold text-navy">会員後援演奏会</h2>
            <Card className="overflow-hidden transition-shadow hover:shadow-md">
              <Link href="/members/supported-concerts" className="block">
                <CardContent className="flex flex-wrap items-center gap-4 py-6 md:flex-nowrap">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-gold/20">
                    <Music2 className="size-7 text-gold" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-navy">協会が後援する会員主催の演奏会</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      会員の皆様が主催する演奏会のうち、協会が後援する演奏会のお知らせ一覧です。
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background hover:bg-accent hover:text-accent-foreground">
                    一覧を見る
                    <ArrowRight className="ml-2 size-4" />
                  </span>
                </CardContent>
              </Link>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
