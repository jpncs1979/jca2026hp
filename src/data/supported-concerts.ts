/**
 * 後援演奏会の表示用型。実データは patronage_concerts テーブル（承認済み）から取得する。
 */

/** 後援演奏会の詳細ページ URL */
export function supportedConcertDetailHref(slug: string): string {
  return `/members/supported-concerts/${slug}`;
}

export interface SupportedConcert {
  id: string;
  slug: string;
  /** 演奏会表題 */
  title: string;
  /** 公演日（表示用） */
  dateLabel: string;
  /** ソート用日付 YYYY-MM-DD */
  date: string;
  /** 開場・開演 */
  time: string;
  /** 会場名 */
  venue: string;
  /** 料金（表示用） */
  price: string;
  performers: string;
  program: string;
  organizer: string;
  /** 案内ページに掲載する問い合わせ先 */
  contact: string;
  /** 掲載日 */
  addedDate: string;
  /** 元のチラシ（画像 / PDF）。PDF はこのリンクで開く */
  flyerUrl: string | null;
  /** 表示用の画像。PDF は1ページ目を画像にしたもの */
  flyerImageUrl: string | null;
  flyerIsPdf: boolean;
}

/** 流れるチラシ帯に出すのは、チラシ（画像・PDF）がある公演だけ */
export function hasFlyer(concert: Pick<SupportedConcert, "flyerUrl">): boolean {
  return Boolean(concert.flyerUrl);
}
