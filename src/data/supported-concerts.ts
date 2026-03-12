/**
 * 会員後援演奏会一覧データ
 * チラシ画像は public/images/supported-concerts/{slug}.jpg または .png に配置
 */

export interface SupportedConcert {
  /** 表示順・チラシファイル名に使用（日付ベース） */
  slug: string;
  /** 公演日（表示用） */
  dateLabel: string;
  /** ソート用日付 YYYY-MM-DD */
  date: string;
  /** 開演時刻 */
  time: string;
  /** 会場名 */
  venue: string;
  /** 会場住所（任意） */
  address?: string;
  /** 料金（表示用） */
  price: string;
  /** 掲載日（データ追加日） */
  addedDate: string;
}

export const supportedConcerts: SupportedConcert[] = [
  {
    slug: "2026-03-28",
    dateLabel: "2026年3月28日（土）",
    date: "2026-03-28",
    time: "14:30",
    venue: "池袋台湾教会",
    address: "〒171-0014 東京都豊島区池袋３丁目６２−９",
    price: "3,000円（要予約）",
    addedDate: "2025/12/10",
  },
  {
    slug: "2026-05-04",
    dateLabel: "2026年5月4日",
    date: "2026-05-04",
    time: "14:00",
    venue: "第一生命ホール",
    price: "自由席 2,500円",
    addedDate: "2025/12/16",
  },
  {
    slug: "2026-05-10",
    dateLabel: "2026年5月10日（日）",
    date: "2026-05-10",
    time: "16:00",
    venue: "アイム・ユニバースてだこホール 小ホール",
    price: "一般 2,000円　学生（高校生以下）1,000円（当日500円増）",
    addedDate: "2026/2/28",
  },
  {
    slug: "2026-05-17",
    dateLabel: "2026年5月17日（日）",
    date: "2026-05-17",
    time: "17:00（予定）",
    venue: "レストラン マエストロ",
    price: "ペア：22,000円（二名分）",
    addedDate: "2026/1/23",
  },
  {
    slug: "2026-05-31",
    dateLabel: "2026年5月31日（日）",
    date: "2026-05-31",
    time: "14:00",
    venue: "iichiko総合文化センター内 iichiko音の泉ホール",
    price: "一般 2,000円、学生（大学生以下）1,000円",
    addedDate: "2026/2/3",
  },
  {
    slug: "2026-07-10",
    dateLabel: "2026年7月10日（金）",
    date: "2026-07-10",
    time: "19:00",
    venue: "品川区立五反田文化センター 音楽ホール",
    price: "全席自由 3,000円（税込）",
    addedDate: "2026/2/26",
  },
  {
    slug: "2026-07-22",
    dateLabel: "2026年7月22日",
    date: "2026-07-22",
    time: "19:00",
    venue: "銀座王子ホール",
    price: "一般 4,000円　U25 2,000円",
    addedDate: "2026/1/16",
  },
].sort((a, b) => a.date.localeCompare(b.date));
