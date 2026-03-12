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
    if (a.rank !== b.rank) return a.rank.localeCompare(b.rank);
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
