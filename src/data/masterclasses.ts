/**
 * マスタークラス一覧データ（イベントページ用）
 */

import { MASTERCLASS_31 } from "@/lib/masterclass-31";

export interface MasterclassSummary {
  slug: string;
  title: string;
  description: string;
  period: string;
  venue: string;
  status: "申込受付中" | "聴講受付中" | "準備中" | "終了";
  /** 詳細（紹介）ページ */
  href: string;
}

export const masterclasses: MasterclassSummary[] = [
  {
    slug: MASTERCLASS_31.slug,
    title: MASTERCLASS_31.title,
    description: MASTERCLASS_31.summary,
    period: MASTERCLASS_31.period,
    venue: MASTERCLASS_31.venue,
    status: MASTERCLASS_31.status,
    href: MASTERCLASS_31.href,
  },
];
