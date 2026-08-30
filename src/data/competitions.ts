/**
 * コンクール一覧データ（イベントページ用）
 */

import { ENSEMBLE_2027 } from "@/lib/ensemble-2027";
import { YOUNG_2026 } from "@/lib/young-2026";

export interface CompetitionSummary {
  slug: string;
  title: string;
  description: string;
  period: string;
  /** 申込受付期間（イベント一覧 #concours 用） */
  applicationPeriod?: string;
  /** 予選動画提出期限（申込とは別、イベント一覧用） */
  videoSubmissionDeadline?: string;
  venue: string;
  href: string;
  /** 参加申込フォーム（申込受付中のみ表示） */
  applyHref?: string;
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
    applicationPeriod: YOUNG_2026.applicationPeriod,
    venue: "パルテノン多摩 小ホール（東京都多摩市）",
    href: "/events/young-2026",
    applyHref: "/events/young-2026/apply",
    status: "申込受付中",
    archiveHref: "/archive?competition=young",
  },
  {
    slug: "ensemble",
    title: "クラリネット・アンサンブルコンクール",
    description:
      "第19回は2027年2月開催。予選は2027年1月上旬の動画審査、本選は東広島芸術文化ホール くららホールにて実施します。",
    period: "予選：2027年1月上旬（動画）／本選：2027年2月27日（土）",
    applicationPeriod: ENSEMBLE_2027.applicationPeriod,
    videoSubmissionDeadline: ENSEMBLE_2027.videoSubmissionDeadline,
    venue: "東広島芸術文化ホール くららホール（本選）",
    href: "/events/ensemble",
    applyHref: "/events/ensemble/apply",
    status: "申込受付中",
    archiveHref: "/archive?competition=ensemble",
  },
];
