import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { ConsultationForm } from "./ConsultationForm";
import { PublishedQAList, type PublicQAItem } from "./PublishedQAList";

export const dynamic = "force-dynamic";

function publicSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url.startsWith("http") || key.length === 0) return null;
  return createClient(url, key, {
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

export const metadata = {
  title: "クラリネット相談室 | 日本クラリネット協会",
  description:
    "クラリネットお助け110番。奏法・リード・楽器など、フォームから質問できます。ご本人の承諾をいただいた質問と回答を掲載しています。",
};

export default async function ConsultationPage() {
  let published: PublicQAItem[] = [];

  const supabase = publicSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("consultation_public_qa")
      .select("id, category, public_name, age, public_question, answer, published_at")
      .order("published_at", { ascending: false })
      .limit(50);
    if (error) {
      console.error("[相談室] 公開Q&Aの取得に失敗:", error.message);
    }
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
            フォームから質問できます。ご本人の承諾をいただいた質問と回答を掲載しています。
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
