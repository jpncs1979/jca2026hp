import Link from "next/link";
import type { SupportedConcert } from "@/data/supported-concerts";
import { supportedConcertDetailHref } from "@/data/supported-concerts";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      <span className="font-medium text-navy">{label}</span>
      <span className="whitespace-pre-wrap">　{value}</span>
    </p>
  );
}

/** チラシの有無にかかわらず、承認済み公演の情報を一覧する */
export function SupportedConcertsList({ concerts }: { concerts: SupportedConcert[] }) {
  return (
    <ul className="space-y-4">
      {concerts.map((concert) => (
        <li key={concert.slug} className="rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <Link
              href={supportedConcertDetailHref(concert.slug)}
              className="text-lg font-semibold text-navy underline-offset-2 hover:text-gold hover:underline"
            >
              {concert.title}
            </Link>
            <span className="text-sm font-medium text-navy">{concert.dateLabel}</span>
          </div>
          <div className="mt-3 space-y-1.5">
            <Row label="開場・開演" value={concert.time} />
            <Row label="場所" value={concert.venue} />
            <Row label="入場料" value={concert.price} />
            <Row label="出演者" value={concert.performers} />
            <Row label="曲目" value={concert.program} />
            <Row label="主催" value={concert.organizer} />
            <Row label="問い合わせ" value={concert.contact} />
          </div>
        </li>
      ))}
    </ul>
  );
}
