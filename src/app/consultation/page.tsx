import Link from "next/link";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { ConsultationForm } from "./ConsultationForm";
import { PublishedQAList } from "./PublishedQAList";
import { supabase } from "@/lib/supabase";

export const metadata = {
  title: "クラリネット相談室 | 日本クラリネット協会",
  description:
    "クラリネットお助け110番！奏法・リード・楽器など、フォームから質問できます。質問と回答の一部をHPで公開しています。",
};

export default async function ConsultationPage() {
  let published: { id: string; category: string; body: string | null; answer: string | null; published_at: string; nickname: string | null; age: string | null }[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("consultation_questions")
      .select("id, category, body, answer, published_at, nickname, age")
      .eq("status", "published")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(50);
    published = data ?? [];
  }

  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-navy md:text-4xl">
            <MessageCircle className="size-8 text-gold" />
            クラリネット相談室（クラリネットお助け110番！）
          </h1>
          <p className="mt-2 text-muted-foreground">
            フォームから質問できます。質問と回答は選択してHPに公開しています。
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-16">
          <section>
            <h2 className="mb-6 text-xl font-semibold text-navy">質問する</h2>
            <ConsultationForm />
          </section>

          <section>
            <h2 className="mb-6 text-xl font-semibold text-navy">公開されているQ&A</h2>
            <PublishedQAList items={published} />
          </section>
        </div>

        <div className="mt-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-navy"
          >
            <ArrowLeft className="size-4" />
            トップへ
          </Link>
        </div>
      </div>
    </div>
  );
}
