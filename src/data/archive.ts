/**
 * 過去の受賞者アーカイブデータ
 * 年度・部門別の入賞者一覧（当面はサンプル構造）
 */

export type CompetitionType = "japan-clarinet" | "young" | "ensemble";

export interface ArchiveEntry {
  year: number;
  competition: CompetitionType;
  category: string;
  rank: string;
  name: string;
  affiliation?: string;
}

/** 選択可能な年度一覧 */
export function getAvailableYears(competition: CompetitionType): number[] {
  const data = archiveData.filter((e) => e.competition === competition);
  const years = [...new Set(data.map((e) => e.year))].sort((a, b) => b - a);
  return years;
}

/** 選択可能な部門一覧 */
export function getAvailableCategories(competition: CompetitionType, year?: number): string[] {
  let data = archiveData.filter((e) => e.competition === competition);
  if (year) data = data.filter((e) => e.year === year);
  const cats = [...new Set(data.map((e) => e.category))].sort();
  return cats;
}

/** フィルタ済みアーカイブ取得 */
export function getArchiveEntries(
  competition: CompetitionType,
  year?: number,
  category?: string
): ArchiveEntry[] {
  let data = archiveData.filter((e) => e.competition === competition);
  if (year) data = data.filter((e) => e.year === year);
  if (category) data = data.filter((e) => e.category === category);
  return data.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank.localeCompare(b.rank);
    return a.name.localeCompare(b.name);
  });
}

/** コンクール表示名 */
export const competitionLabels: Record<CompetitionType, string> = {
  "japan-clarinet": "日本クラリネットコンクール",
  young: "ヤング・クラリネッティストコンクール",
  ensemble: "クラリネット・アンサンブルコンクール",
};

// サンプルデータ（実際のデータに差し替えてください）
const archiveData: ArchiveEntry[] = [
  { year: 2024, competition: "young", category: "ヤング・アーティスト部門", rank: "第1位", name: "（受賞者名）", affiliation: "（所属）" },
  { year: 2024, competition: "young", category: "ヤング・アーティスト部門", rank: "第2位", name: "（受賞者名）", affiliation: "（所属）" },
  { year: 2024, competition: "young", category: "ジュニアB部門", rank: "第1位", name: "（受賞者名）", affiliation: "（所属）" },
  { year: 2022, competition: "young", category: "ヤング・アーティスト部門", rank: "第1位", name: "（受賞者名）", affiliation: "（所属）" },
];
