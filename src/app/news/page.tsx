import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Newspaper } from "lucide-react";

export const metadata = {
  title: "ニュース | 日本クラリネット協会",
  description: "一般社団法人日本クラリネット協会からのお知らせ・ニュース一覧",
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
            日本クラリネット協会からのお知らせ・最新情報
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-6">
          {newsItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                現在、お知らせはありません。
              </CardContent>
            </Card>
          ) : (
            newsItems.map((item) => (
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
