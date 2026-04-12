import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Music2, ArrowLeft } from "lucide-react";
import { supportedConcerts, supportedConcertDetailHref } from "@/data/supported-concerts";
import { SupportedConcertsMarquee } from "@/components/supported-concerts/SupportedConcertsMarquee";
import { SupportedConcertsCalendar } from "@/components/supported-concerts/SupportedConcertsCalendar";
import { SupportedConcertPanel } from "@/components/supported-concerts/SupportedConcertPanel";

export const metadata = {
  title: "会員後援演奏会のお知らせ | 日本クラリネット協会",
  description:
    "協会会員の皆様が主催する演奏会のうち、協会が後援する演奏会のお知らせです。",
};

export default function SupportedConcertsPage() {
  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-navy md:text-4xl">
            <Music2 className="size-8 text-gold" />
            会員後援演奏会のお知らせ
          </h1>
          <p className="mt-2 text-muted-foreground">
            協会会員の皆様が主催する演奏会のうち、協会が後援する演奏会のお知らせです。
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-4xl space-y-12">
          <section>
            <h2 className="mb-4 text-xl font-semibold text-navy">チラシ一覧（スクロール）</h2>
            <SupportedConcertsMarquee concerts={supportedConcerts} />
            <div className="mt-8">
              <p className="mb-3 text-sm font-medium text-navy">公演日カレンダー</p>
              <div className="max-w-md">
                <SupportedConcertsCalendar concerts={supportedConcerts} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                チラシまたはカレンダーの公演日をクリックすると、各公演の詳細ページへ移動します。
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-6 text-xl font-semibold text-navy">公演一覧</h2>
            <div className="space-y-8">
              {supportedConcerts.map((concert) => (
                <Link
                  key={concert.slug}
                  href={supportedConcertDetailHref(concert.slug)}
                  className="block rounded-xl outline-none ring-offset-2 transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <SupportedConcertPanel concert={concert} />
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="mx-auto mt-12 flex max-w-4xl flex-wrap gap-4">
          <Link href="/membership#members">
            <Button variant="outline">
              <ArrowLeft className="mr-2 size-4" />
              入会案内に戻る
            </Button>
          </Link>
          <Link href="/news">
            <Button className="bg-gold text-gold-foreground hover:bg-gold-muted">
              ニュースを見る
            </Button>
          </Link>
        </div>

        <p className="mx-auto mt-8 max-w-4xl text-center text-sm text-muted-foreground">
          後援演奏会の掲載をご希望の会員の皆様は、事務局までお問い合わせください。
        </p>
      </div>
    </div>
  );
}
