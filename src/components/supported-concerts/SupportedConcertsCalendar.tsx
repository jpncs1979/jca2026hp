"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SupportedConcert } from "@/data/supported-concerts";

const LIST_URL = "/members/supported-concerts";

/** 公演がある月の範囲を取得 */
function getConcertMonthRange(concerts: SupportedConcert[]) {
  if (concerts.length === 0) return { minYear: 2026, minMonth: 1, maxYear: 2026, maxMonth: 12 };
  const dates = concerts.map((c) => c.date);
  const min = dates[0]!;
  const max = dates[dates.length - 1]!;
  const [minYear, minMonth] = min.split("-").map(Number);
  const [maxYear, maxMonth] = max.split("-").map(Number);
  return { minYear, minMonth, maxYear, maxMonth };
}

/** 1月分のみ表示し、前月・翌月で切り替え可能なカレンダー */
export function SupportedConcertsCalendar({
  concerts,
}: {
  concerts: SupportedConcert[];
}) {
  const { minYear, minMonth, maxYear, maxMonth } = useMemo(
    () => getConcertMonthRange(concerts),
    [concerts]
  );

  const [currentYear, setCurrentYear] = useState(minYear);
  const [currentMonth, setCurrentMonth] = useState(minMonth);

  const concertByDate = useMemo(
    () => new Map(concerts.map((c) => [c.date, c])),
    [concerts]
  );

  const goPrev = () => {
    if (currentMonth === 1) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (currentMonth === 12) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const canGoPrev = currentYear > minYear || (currentYear === minYear && currentMonth > minMonth);
  const canGoNext = currentYear < maxYear || (currentYear === maxYear && currentMonth < maxMonth);

  const year = currentYear;
  const month = currentMonth;
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const label = `${year}年${month}月`;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canGoPrev}
          className="flex size-8 items-center justify-center rounded-lg border border-border text-navy transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
          aria-label="前月"
        >
          <ChevronLeft className="size-5" />
        </button>
        <p className="text-sm font-medium text-navy">{label}</p>
        <button
          type="button"
          onClick={goNext}
          disabled={!canGoNext}
          className="flex size-8 items-center justify-center rounded-lg border border-border text-navy transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
          aria-label="翌月"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
        {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
          <span key={d} className="py-0.5 text-muted-foreground">
            {d}
          </span>
        ))}
        {blanks.map((i) => (
          <span key={`b-${i}`} className="min-h-[1.75rem]" />
        ))}
        {days.map((day) => {
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const concert = concertByDate.get(dateStr);
          const isConcert = !!concert;
          return (
            <span key={day} className="min-h-[1.75rem]">
              {isConcert ? (
                <Link
                  href={`${LIST_URL}#${concert!.slug}`}
                  className="flex size-7 items-center justify-center rounded-full bg-gold/20 font-medium text-gold transition-colors hover:bg-gold/30 hover:text-gold"
                  title={`${concert!.dateLabel} ${concert!.venue}`}
                >
                  {day}
                </Link>
              ) : (
                <span className="flex size-7 items-center justify-center text-muted-foreground">
                  {day}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
