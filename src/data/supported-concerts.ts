/**
 * 後援演奏会一覧データ
 * チラシ画像は public/images/supported-concerts/{slug}.jpg または .png に配置
 *
 * 公開できる情報が揃うまで空配列。追加したら一覧・カレンダーに自動反映される。
 */

/** 後援演奏会の詳細ページ URL */
export function supportedConcertDetailHref(slug: string): string {
  return `/members/supported-concerts/${slug}`;
}

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

/** 掲載可能な公演が決まり次第、ここに追加する */
export const supportedConcerts: SupportedConcert[] = [];
