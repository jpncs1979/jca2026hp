"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Archive, ArrowRight, Trophy } from "lucide-react";
import {
  competitionLabels,
  getAvailableYears,
  getAvailableCategories,
  getArchiveEntries,
  type CompetitionType,
} from "@/data/archive";

export default function ArchivePage() {
  const [competition, setCompetition] = useState<CompetitionType>("young");
  const [year, setYear] = useState<number | "">("");
  const [category, setCategory] = useState<string>("");

  const years = getAvailableYears(competition);
  const categories = getAvailableCategories(competition, year || undefined);
  const entries = getArchiveEntries(
    competition,
    year || undefined,
    category || undefined
  );

  return (
    <div className="font-soft">
      <div className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-navy md:text-4xl">
            <Archive className="size-8 text-gold" />
            過去の受賞者アーカイブ
          </h1>
          <p className="mt-2 text-muted-foreground">
            各コンクールの入賞者を年度・部門別にご覧いただけます
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* フィルター */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">検索条件</CardTitle>
              <CardDescription>
                コンクール・年度・部門を選択してください
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">コンクール</label>
                <select
                  value={competition}
                  onChange={(e) => {
                    setCompetition(e.target.value as CompetitionType);
                    setYear("");
                    setCategory("");
                  }}
                  className="flex h-10 min-w-[240px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="japan-clarinet">
                    {competitionLabels["japan-clarinet"]}
                  </option>
                  <option value="young">{competitionLabels.young}</option>
                  <option value="ensemble">{competitionLabels.ensemble}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">年度</label>
                <select
                  value={year}
                  onChange={(e) => {
                    setYear(e.target.value ? Number(e.target.value) : "");
                    setCategory("");
                  }}
                  className="flex h-10 min-w-[120px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="">すべて</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}年
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">部門</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-10 min-w-[200px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="">すべて</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* 結果テーブル */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {competitionLabels[competition]}
                {year && ` ${year}年`}
                {category && ` ${category}`}
              </CardTitle>
              <CardDescription>
                {entries.length}件の入賞者が見つかりました
              </CardDescription>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">
                  該当する入賞者がありません。
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-3 text-left font-medium">順位</th>
                        <th className="py-3 text-left font-medium">氏名</th>
                        <th className="py-3 text-left font-medium">所属</th>
                        <th className="py-3 text-left font-medium">部門</th>
                        <th className="py-3 text-left font-medium">年度</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e, i) => (
                        <tr
                          key={i}
                          className="border-b border-border last:border-0"
                        >
                          <td className="py-3">{e.rank}</td>
                          <td className="py-3 font-medium">{e.name}</td>
                          <td className="py-3 text-muted-foreground">
                            {e.affiliation ?? "—"}
                          </td>
                          <td className="py-3">{e.category}</td>
                          <td className="py-3">{e.year}年</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 各コンクールへのリンク */}
          <div className="flex flex-wrap gap-4">
            <Link href="/events/japan-clarinet">
              <span className="inline-flex items-center gap-1 text-sm text-gold hover:underline">
                <Trophy className="size-4" />
                {competitionLabels["japan-clarinet"]}の詳細
                <ArrowRight className="size-4" />
              </span>
            </Link>
            <Link href="/events/young-2026">
              <span className="inline-flex items-center gap-1 text-sm text-gold hover:underline">
                <Trophy className="size-4" />
                {competitionLabels.young}の詳細
                <ArrowRight className="size-4" />
              </span>
            </Link>
            <Link href="/events/ensemble">
              <span className="inline-flex items-center gap-1 text-sm text-gold hover:underline">
                <Trophy className="size-4" />
                {competitionLabels.ensemble}の詳細
                <ArrowRight className="size-4" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
