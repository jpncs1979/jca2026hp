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
  contact: string;
  notes?: string;
  /** 掲載日 */
  addedDate: string;
  flyerUrl: string | null;
  flyerIsPdf: boolean;
}

/** 流れるチラシ帯に出すのは、画像ファイルがある公演だけ */
export function hasImageFlyer(
  concert: Pick<SupportedConcert, "flyerUrl" | "flyerIsPdf">
): boolean {
  return Boolean(concert.flyerUrl) && !concert.flyerIsPdf;
}
