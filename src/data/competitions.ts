/**
 * コンクール一覧データ（イベントページ用）
 */

export interface CompetitionSummary {
  slug: string;
  title: string;
  description: string;
  period: string;
  venue: string;
  href: string;
  status: "申込受付中" | "準備中" | "終了";
  archiveHref?: string;
}

export const competitions: CompetitionSummary[] = [
  {
    slug: "japan-clarinet",
    title: "日本クラリネットコンクール",
    description:
      "4年に1度開催される日本クラリネット協会のフラッグシップコンクール。クラリネットの最高峰を目指す奏者たちが集います。",
    period: "4年ごとに開催",
    venue: "詳細は開催時に発表",
    href: "/events/japan-clarinet",
    status: "準備中",
    archiveHref: "/archive?competition=japan-clarinet",
  },
  {
    slug: "young-2026",
    title: "ヤング・クラリネッティストコンクール",
    description:
      "若手の登竜門。ジュニアA（13歳以下）、ジュニアB（17歳以下）、ヤング・アーティスト（20歳以下）。2026年8月、パルテノン多摩にて開催。",
    period: "2026年8月25日（火）～27日（木）",
    venue: "パルテノン多摩 小ホール（東京都多摩市）",
    href: "/events/young-2026",
    status: "申込受付中",
    archiveHref: "/archive?competition=young",
  },
  {
    slug: "ensemble",
    title: "クラリネット・アンサンブルコンクール",
    description:
      "重奏の祭典。デュオから大編成まで、クラリネットアンサンブルの魅力を競い合うコンクールです。",
    period: "詳細は開催時に発表",
    venue: "詳細は開催時に発表",
    href: "/events/ensemble",
    status: "準備中",
    archiveHref: "/archive?competition=ensemble",
  },
];
