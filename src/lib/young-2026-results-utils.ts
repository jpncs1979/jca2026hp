import type {
  Young2026ResultCategory,
  Young2026ResultEntry,
} from "@/data/young-2026-results";

export const YOUNG_2026_RESULT_CATEGORY_ORDER: Young2026ResultCategory[] = [
  "ヤング・アーティスト部門",
  "ジュニアB部門",
  "ジュニアA部門",
];

const nameCollator = new Intl.Collator("ja");

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
  if (normalized.includes("金賞")) return 1;
  if (normalized.includes("銀賞")) return 2;
  if (normalized.includes("銅賞")) return 3;
  return 998;
}

export function sortYoung2026Results(
  entries: Young2026ResultEntry[]
): Young2026ResultEntry[] {
  return [...entries].sort((a, b) => {
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

export function groupYoung2026ResultsByCategory(
  entries: Young2026ResultEntry[]
): [Young2026ResultCategory, Young2026ResultEntry[]][] {
  const map = new Map<Young2026ResultCategory, Young2026ResultEntry[]>();
  for (const e of entries) {
    const list = map.get(e.category) ?? [];
    list.push(e);
    map.set(e.category, list);
  }
  return YOUNG_2026_RESULT_CATEGORY_ORDER.map((cat) => {
    const list = sortYoung2026Results(map.get(cat) ?? []);
    return [cat, list] as [Young2026ResultCategory, Young2026ResultEntry[]];
  }).filter(([, list]) => list.length > 0);
}

/** 入選以外（順位・金銀銅など）は写真付きカード表示 */
export function isFeaturedYoung2026Result(rank: string): boolean {
  return !rank.includes("入選");
}

export function resolveYoung2026PhotoSrc(
  entry: Young2026ResultEntry
): string | undefined {
  if (entry.photoSrc?.trim()) return entry.photoSrc.trim();
  if (entry.photoId?.trim()) {
    return `/images/young-2026/results/portraits/${entry.photoId.trim()}.jpg`;
  }
  return undefined;
}
