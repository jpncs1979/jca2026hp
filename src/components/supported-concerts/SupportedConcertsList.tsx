import Link from "next/link";
import type { SupportedConcert } from "@/data/supported-concerts";
import { supportedConcertDetailHref } from "@/data/supported-concerts";

/** 承認済み公演を、日付と表題だけ並べる。行のクリックで詳細ページへ。 */
export function SupportedConcertsList({ concerts }: { concerts: SupportedConcert[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
      {concerts.map((concert) => (
        <li key={concert.slug}>
          <Link
            href={supportedConcertDetailHref(concert.slug)}
            className="flex flex-col gap-1 px-4 py-3 text-navy transition-colors hover:bg-muted/60 hover:text-gold sm:flex-row sm:items-baseline sm:gap-6"
          >
            <span className="shrink-0 text-sm font-medium tabular-nums">{concert.dateLabel}</span>
            <span className="font-semibold sm:min-w-0">{concert.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
