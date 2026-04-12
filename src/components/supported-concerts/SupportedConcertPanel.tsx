import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Ticket } from "lucide-react";
import type { SupportedConcert } from "@/data/supported-concerts";
import { ConcertFlyer } from "./ConcertFlyer";

/** 一覧・詳細で共通のチラシ＋公演情報ブロック */
export function SupportedConcertPanel({ concert }: { concert: SupportedConcert }) {
  return (
    <Card className="scroll-mt-24 overflow-hidden border-border shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row md:items-stretch">
          <div className="relative w-full shrink-0 md:w-[min(42%,320px)]">
            <div className="relative aspect-[3/4] w-full md:aspect-auto md:h-full md:min-h-[280px]">
              <ConcertFlyer
                slug={concert.slug}
                alt={`${concert.dateLabel} ${concert.venue}`}
              />
            </div>
          </div>
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
            <p className="text-xs text-muted-foreground">掲載日：{concert.addedDate}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
