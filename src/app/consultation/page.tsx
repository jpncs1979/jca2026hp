import Link from "next/link";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { ConsultationForm } from "./ConsultationForm";

export const metadata = {
  title: "クラリネット相談室 | 日本クラリネット協会",
  description:
    "クラリネットお助け110番！奏法・リード・楽器など、フォームから質問できます。相談内容は後日まとめて公開いたします。",
};

export default function ConsultationPage() {
  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-navy md:text-4xl">
            <MessageCircle className="size-8 text-gold" />
            クラリネット相談室（クラリネットお助け110番！）
          </h1>
          <p className="mt-2 text-muted-foreground">
            クラリネットに関するお悩みを受け付けています。フォームから質問できます。
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
            <h2 className="mb-6 text-xl font-semibold text-navy">公開について</h2>
            <div className="rounded-lg border border-border bg-muted/20 p-4 text-muted-foreground">
               公開開始まで、しばらくお待ちください。
            </div>
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
