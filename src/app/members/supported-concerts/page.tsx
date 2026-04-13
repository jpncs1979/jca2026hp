import { Music2 } from "lucide-react";
import { supportedConcerts } from "@/data/supported-concerts";
import { SupportedConcertsMarquee } from "@/components/supported-concerts/SupportedConcertsMarquee";
import { SupportedConcertsCalendar } from "@/components/supported-concerts/SupportedConcertsCalendar";

export const metadata = {
  title: "後援演奏会のお知らせ | 日本クラリネット協会",
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
            後援演奏会のお知らせ
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
                チラシまたはカレンダーの公演日をクリックすると、該当の演奏会の詳細ページが表示されます。
              </p>
            </div>
          </section>
        </div>

        <p className="mx-auto mt-12 max-w-4xl text-center text-sm text-muted-foreground">
          後援演奏会の掲載をご希望の会員の皆様は、事務局までお問い合わせください。
        </p>
      </div>
    </div>
  );
}
