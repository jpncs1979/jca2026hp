import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Music2, ArrowLeft, Calendar, Clock, MapPin, Ticket } from "lucide-react";
import { supportedConcerts } from "@/data/supported-concerts";
import { ConcertFlyer } from "@/components/supported-concerts/ConcertFlyer";

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
          {supportedConcerts.map((concert) => (
            <Card
              id={concert.slug}
              key={concert.slug}
              className="scroll-mt-24 overflow-hidden border-border shadow-sm transition-shadow hover:shadow-md"
            >
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-stretch">
                  {/* チラシを主役に：左（または上）に大きく表示 */}
                  <div className="relative w-full shrink-0 md:w-[min(42%,320px)]">
                    <div className="relative aspect-[3/4] w-full md:aspect-auto md:h-full md:min-h-[280px]">
                      <ConcertFlyer
                        slug={concert.slug}
                        alt={`${concert.dateLabel} ${concert.venue}`}
                      />
                    </div>
                  </div>
                  {/* 日時・会場・料金はチラシの横（または下）にコンパクトに */}
                  <div className="flex flex-1 flex-col justify-center gap-4 p-6 md:py-6 md:pl-6">
                    <div className="space-y-3 text-sm">
                      <p className="flex items-center gap-2 font-semibold text-navy">
                        <Calendar className="size-4 shrink-0 text-gold" />
                        {concert.dateLabel}
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="size-4 shrink-0 text-gold" />
                        {concert.time}
                      </p>
                      <p className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
                        <span>
                          {concert.venue}
                          {concert.address != null && (
                            <span className="mt-1 block text-xs">{concert.address}</span>
                          )}
                        </span>
                      </p>
                      <p className="flex items-start gap-2 text-muted-foreground">
                        <Ticket className="mt-0.5 size-4 shrink-0 text-gold" />
                        <span>{concert.price}</span>
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      掲載日：{concert.addedDate}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
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

        <p className="mt-8 text-center text-sm text-muted-foreground">
          後援演奏会の掲載をご希望の会員の皆様は、事務局までお問い合わせください。
        </p>
      </div>
    </div>
  );
}
