import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { renderNewsContent } from "@/lib/news-content";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("news")
    .select("id, title, content, publish_date, is_important")
    .eq("id", id)
    .lte("publish_date", new Date().toISOString().slice(0, 10))
    .single();

  if (!item) notFound();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16 font-soft">
      <Link
        href="/#news"
        className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-navy"
      >
        <ArrowLeft className="size-4" />
        トップページに戻る
      </Link>

      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <span>{item.publish_date.replace(/-/g, "/")}</span>
        {item.is_important ? (
          <span className="rounded bg-gold/20 px-2 py-0.5 text-xs font-medium text-gold-foreground">
            重要
          </span>
        ) : null}
      </div>

      <h1 className="mb-8 text-2xl font-semibold text-navy md:text-3xl">
        {item.title}
      </h1>

      <div className="whitespace-pre-wrap leading-relaxed text-foreground">
        {renderNewsContent(item.content)}
      </div>
    </div>
  );
}
