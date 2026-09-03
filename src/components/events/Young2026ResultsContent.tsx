import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Camera, Trophy } from "lucide-react";
import {
  YOUNG_2026_RESULTS,
  type Young2026ResultEntry,
} from "@/data/young-2026-results";
import { YOUNG_2026 } from "@/lib/young-2026";
import {
  groupYoung2026ResultsByCategory,
  isFeaturedYoung2026Result,
  resolveYoung2026PhotoSrc,
} from "@/lib/young-2026-results-utils";

function WinnerPhoto({
  entry,
  featured,
}: {
  entry: Young2026ResultEntry;
  featured: boolean;
}) {
  const src = resolveYoung2026PhotoSrc(entry);
  const sizeClass = featured
    ? "aspect-[3/4] w-full max-w-[220px]"
    : "aspect-square size-16 shrink-0";

  if (src) {
    return (
      <div
        className={`relative overflow-hidden rounded-lg border border-border bg-muted/30 ${sizeClass}`}
      >
        <Image
          src={src}
          alt={entry.name}
          fill
          className="object-cover object-[center_22%]"
          sizes={featured ? "(max-width: 768px) 50vw, 220px" : "64px"}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/20 text-muted-foreground ${sizeClass}`}
      aria-hidden={featured}
    >
      <Camera className={featured ? "size-8 opacity-40" : "size-5 opacity-40"} />
      {featured ? (
        <span className="px-2 text-center text-xs opacity-60">写真準備中</span>
      ) : null}
    </div>
  );
}

function FeaturedWinnerCard({ entry }: { entry: Young2026ResultEntry }) {
  return (
    <div className="flex flex-col items-center text-center">
      <WinnerPhoto entry={entry} featured />
      <p className="mt-3 text-sm font-medium text-gold">{entry.rank}</p>
      <p className="mt-1 text-base font-medium text-navy">{entry.name}</p>
      {entry.award ? (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {entry.award}
        </p>
      ) : null}
    </div>
  );
}

function HonorableMentionTable({ entries }: { entries: Young2026ResultEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="w-24 py-2 text-left font-medium">順位</th>
            <th className="min-w-0 py-2 text-left font-medium">氏名</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr key={`${entry.name}-${i}`} className="border-b border-border last:border-0">
              <td className="w-24 py-2 align-middle">{entry.rank}</td>
              <td className="min-w-0 py-2 align-middle">
                <div className="flex items-center gap-3">
                  <WinnerPhoto entry={entry} featured={false} />
                  <div>
                    <span className="font-medium">{entry.name}</span>
                    {entry.award ? (
                      <span className="ml-2 text-muted-foreground">{entry.award}</span>
                    ) : null}
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Young2026ResultsContent() {
  const grouped = groupYoung2026ResultsByCategory(YOUNG_2026_RESULTS.entries);
  const hasResults = YOUNG_2026_RESULTS.entries.length > 0;

  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <p className="text-sm font-medium text-gold">
            第{YOUNG_2026_RESULTS.edition}回　{YOUNG_2026_RESULTS.year}年
          </p>
          <h1 className="mt-2 flex items-center gap-2 text-3xl font-bold text-navy md:text-4xl">
            <Trophy className="size-8 shrink-0 text-gold" />
            本選結果発表
          </h1>
          <p className="mt-2 text-muted-foreground">
            {YOUNG_2026.name} — {YOUNG_2026_RESULTS.venue}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            掲載日：{YOUNG_2026_RESULTS.publishedLabel}
          </p>
          {hasResults ? (
            <p className="mt-2 text-sm text-muted-foreground">
              ※同順位内の並びはあいうえお順
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/events/young-2026">
              <Button variant="outline" size="lg">
                参加要項
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
            <Link href="/archive?competition=young">
              <Button variant="outline" size="lg">
                過去の受賞者
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-4xl space-y-10">
          {!hasResults ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-navy">結果掲載について</CardTitle>
                <CardDescription>
                  入賞者の氏名・順位を順次掲載します。入賞者の写真は準備でき次第追加します。
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            grouped.map(([category, entries]) => {
              const featured = entries.filter((e) =>
                isFeaturedYoung2026Result(e.rank)
              );
              const honorable = entries.filter(
                (e) => !isFeaturedYoung2026Result(e.rank)
              );

              return (
                <section key={category}>
                  <h2 className="mb-6 border-b border-border pb-2 text-xl font-medium text-navy">
                    {category}
                  </h2>

                  {featured.length > 0 ? (
                    <div className="mb-8 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 md:gap-8">
                      {featured.map((entry, i) => (
                        <FeaturedWinnerCard key={`${entry.name}-${i}`} entry={entry} />
                      ))}
                    </div>
                  ) : null}

                  {honorable.length > 0 ? (
                    <div>
                      <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                        入選
                      </h3>
                      <HonorableMentionTable entries={honorable} />
                    </div>
                  ) : null}
                </section>
              );
            })
          )}

          <Card className="border-gold/20 bg-gold/5">
            <CardContent className="py-6 text-sm text-muted-foreground">
              <p>
                入賞者の皆さま、おめでとうございます。
              </p>
              <p className="mt-2">
                本結果はアーカイブにも登録予定です（{" "}
                <Link
                  href="/archive?competition=young"
                  className="text-gold hover:underline"
                >
                  過去の受賞者
                </Link>
                ）。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
