/**
 * 過去の受賞者アーカイブデータ
 * 年度・部門別の入賞者一覧
 */

import { youngWinnersArchiveData } from "./young-winners-archive";
import { japanClarinetWinnersArchiveData } from "./japan-clarinet-winners-archive";
import { ensembleWinnersArchiveData } from "./ensemble-winners-archive";

export type CompetitionType = "japan-clarinet" | "young" | "ensemble";

export interface ArchiveEntry {
  year: number;
  competition: CompetitionType;
  category: string;
  rank: string;
  name: string;
  /** 副賞（協賛三社賞・パルテノン多摩賞・ザ・クラリネット賞など） */
  award?: string;
  /** 同一順位内の表示順（指定時は氏名のあいうえお順より優先） */
  displayOrder?: number;
}

/** 選択可能な年度一覧 */
export function getAvailableYears(competition: CompetitionType): number[] {
  const data = archiveData.filter((e) => e.competition === competition);
  const years = [...new Set(data.map((e) => e.year))].sort((a, b) => b - a);
  return years;
}

/** ヤングコンクールの部門の表示順 */
const YOUNG_CATEGORY_ORDER = ["ヤング・アーティスト部門", "ジュニアB部門", "ジュニアA部門"];

/** 選択可能な部門一覧（ヤングは ヤング・アーティスト → ジュニアB → ジュニアA の順） */
export function getAvailableCategories(competition: CompetitionType, year?: number): string[] {
  let data = archiveData.filter((e) => e.competition === competition);
  if (year) data = data.filter((e) => e.year === year);
  const set = new Set(data.map((e) => e.category));
  if (competition === "young") {
    return YOUNG_CATEGORY_ORDER.filter((c) => set.has(c));
  }
  return [...set].sort();
}

/** 同一順位内で氏名をあいうえお順に並べるための比較器 */
const nameCollator = new Intl.Collator("ja");

/** 順位ソート用: 数値順位を優先し、入選は最後 */
function getRankOrder(rank: string): number {
  const normalized = rank
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .replace(/１/g, "1")
    .replace(/２/g, "2")
    .replace(/３/g, "3")
    .replace(/４/g, "4")
    .replace(/５/g, "5")
    .replace(/６/g, "6")
    .replace(/７/g, "7")
    .replace(/８/g, "8")
    .replace(/９/g, "9")
    .replace(/０/g, "0");

  const m = normalized.match(/第\s*(\d+)\s*位/);
  if (m) return Number(m[1]);
  if (normalized.includes("入選")) return 999;
  if (normalized.includes("グランプリ")) return 0;
  return 998;
}

/** フィルタ済みアーカイブ取得（同一順位は氏名のあいうえお順） */
export function getArchiveEntries(
  competition: CompetitionType,
  year?: number,
  category?: string
): ArchiveEntry[] {
  let data = archiveData.filter((e) => e.competition === competition);
  if (year) data = data.filter((e) => e.year === year);
  if (category) data = data.filter((e) => e.category === category);
  return data.sort((a, b) => {
    const aRank = getRankOrder(a.rank);
    const bRank = getRankOrder(b.rank);
    if (aRank !== bRank) return aRank - bRank;
    if (a.rank !== b.rank) return a.rank.localeCompare(b.rank, "ja");
    const aOrder = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return nameCollator.compare(a.name, b.name);
  });
}

/** コンクール表示名 */
export const competitionLabels: Record<CompetitionType, string> = {
  "japan-clarinet": "日本クラリネットコンクール",
  young: "ヤング・クラリネッティストコンクール",
  ensemble: "クラリネット・アンサンブルコンクール",
};

/** 年度 → 回数（第○回）の対応。回数と年度を併記表示するために使用 */
const yearToEdition: Record<CompetitionType, Record<number, number>> = {
  "japan-clarinet": {
    1987: 1, 1988: 2, 1991: 3, 1996: 4, 2000: 5, 2004: 6, 2008: 7, 2012: 8, 2016: 9, 2021: 10, 2025: 11,
  },
  young: {
    1999: 1, 2001: 2, 2003: 3, 2007: 4, 2009: 5, 2011: 6, 2013: 7, 2015: 8, 2017: 9, 2019: 10, 2021: 11, 2023: 12, 2024: 13, 2025: 14,
  },
  ensemble: {
    2004: 1, 2005: 2, 2006: 3, 2007: 4, 2008: 5, 2009: 6, 2010: 7, 2011: 8, 2012: 9, 2013: 10, 2014: 11, 2015: 12, 2016: 13,
  },
};

/** 指定コンクール・年度の回数（第○回）。ない場合は undefined */
export function getEdition(competition: CompetitionType, year: number): number | undefined {
  return yearToEdition[competition][year];
}

const archiveData: ArchiveEntry[] = [
  ...japanClarinetWinnersArchiveData,
  ...youngWinnersArchiveData,
  ...ensembleWinnersArchiveData,
];
