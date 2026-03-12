"use client";

import { useState, useEffect } from "react";
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
  getEdition,
  type CompetitionType,
} from "@/data/archive";

const JAPAN_CLARINET: CompetitionType = "japan-clarinet";
const ENSEMBLE: CompetitionType = "ensemble";

/** 部門選択が必要なのはヤングのみ（日本クラリネット・アンコンは年度のみ） */
function needsCategory(competition: CompetitionType): boolean {
  return competition !== JAPAN_CLARINET && competition !== ENSEMBLE;
}

/** リスト表に部門列を出すか（ヤングはタイトルに部門、アンコンは部門ごとブロックで出すので表の列には出さない） */
function showCategoryColumn(competition: CompetitionType): boolean {
  return false;
}

export default function ArchivePage() {
  const [competition, setCompetition] = useState<CompetitionType>("young");
  const [year, setYear] = useState<number | "">("");
  const [category, setCategory] = useState<string>("");

  const years = getAvailableYears(competition);
  const categories = getAvailableCategories(competition, year || undefined);

  // コンクール変更時: 年度を先頭に、部門をクリア
  useEffect(() => {
    const y = getAvailableYears(competition);
    setYear(y.length > 0 ? y[0] : "");
    setCategory("");
  }, [competition]);

  // 年度変更時: 部門を先頭に（部門が必要なコンクールのみ）
  useEffect(() => {
    if (!needsCategory(competition) || year === "") return;
    const c = getAvailableCategories(competition, year);
    setCategory(c.length > 0 ? c[0] : "");
  }, [competition, year]);

  const entries = getArchiveEntries(
    competition,
    year || undefined,
    needsCategory(competition) ? category || undefined : undefined
  );

  /** アンコン用: 部門ごとにグループ化（部門名でソート） */
  const entriesByCategory =
    competition === ENSEMBLE && year !== ""
      ? (() => {
          const map = new Map<string, typeof entries>();
          for (const e of entries) {
            const list = map.get(e.category) ?? [];
            list.push(e);
            map.set(e.category, list);
          }
          const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b, "ja"));
          return sorted;
        })()
      : null;

  /** リスト表示条件: 日本クラリネット・アンコンは コンクール+年度、ヤングは コンクール+年度+部門 が揃ったとき */
  const canShowList =
    year !== "" &&
    (competition === JAPAN_CLARINET || competition === ENSEMBLE || category !== "");

  /** 見出し用: 回数と年度を併記（例: 第11回 2025年） */
  const edition = year !== "" && typeof year === "number" ? getEdition(competition, year) : undefined;
  const editionLabel =
    year !== "" && typeof year === "number"
      ? edition != null
        ? `第${edition}回 ${year}年`
        : `${year}年`
      : "";

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
                コンクールと年度
                {needsCategory(competition) ? "・部門" : ""}
                を選ぶと入賞者一覧が表示されます
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">コンクール</label>
                <select
                  value={competition}
                  onChange={(e) => setCompetition(e.target.value as CompetitionType)}
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
                  onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "")}
                  className="flex h-10 min-w-[120px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}年
                    </option>
                  ))}
                </select>
              </div>
              {needsCategory(competition) && (
                <div>
                  <label className="mb-1 block text-sm font-medium">部門</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex h-10 min-w-[200px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 結果テーブル（コンクール・年度・部門が揃ったときのみ表示。日本クラリネットは部門なし） */}
          {!canShowList ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  コンクールと年度
                  {needsCategory(competition) ? "と部門" : ""}
                  を選ぶと入賞者一覧が表示されます。
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {competitionLabels[competition]}
                  {editionLabel && ` ${editionLabel}`}
                  {needsCategory(competition) && category && ` ${category}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {entries.length === 0 ? (
                  <p className="py-12 text-center text-muted-foreground">
                    該当する入賞者がありません。
                  </p>
                ) : entriesByCategory != null ? (
                  /* アンコン: 部門ごとにブロックで表示（順位・氏名） */
                  <div className="space-y-8">
                    {entriesByCategory.map(([cat, list]) => (
                      <section key={cat}>
                        <h3 className="mb-3 border-b border-border pb-2 text-base font-medium">
                          {cat}
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full table-fixed border-collapse text-sm">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="w-24 py-2 text-left font-medium">順位</th>
                                <th className="min-w-0 py-2 text-left font-medium">氏名</th>
                              </tr>
                            </thead>
                            <tbody>
                              {list.map((e, i) => (
                                <tr
                                  key={i}
                                  className="border-b border-border last:border-0"
                                >
                                  <td className="w-24 py-2">{e.rank}</td>
                                  <td className="min-w-0 py-2">
                                    <span className="font-medium">{e.name}</span>
                                    {e.award != null && e.award !== "" && (
                                      <span className="ml-2 text-muted-foreground">{e.award}</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="w-24 py-3 text-left font-medium">順位</th>
                          <th className="min-w-0 py-3 text-left font-medium">氏名</th>
                          {showCategoryColumn(competition) && (
                            <th className="w-52 py-3 text-left font-medium">部門</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((e, i) => (
                          <tr
                            key={i}
                            className="border-b border-border last:border-0"
                          >
                            <td className="w-24 py-3">{e.rank}</td>
                            <td className="min-w-0 py-3">
                              <span className="font-medium">{e.name}</span>
                              {e.award != null && e.award !== "" && (
                                <span className="ml-2 text-muted-foreground">{e.award}</span>
                              )}
                            </td>
                            {showCategoryColumn(competition) && (
                              <td className="w-52 py-3">{e.category}</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
