/**
 * 会報 Web 版のデータ型。
 * 1号 = 1ファイル（src/data/kaiho/<号数>.ts）。原稿・写真・台割から Claude Code がこの形に起こす。
 */

export type KaihoImage = {
  /** public 配下のパス（例: /kaiho/175/xxx.jpg） */
  src: string;
  width: number;
  height: number;
  caption?: string;
};

export type KaihoBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | ({ type: "image" } & KaihoImage)
  | {
      type: "program";
      /** 例: 「7月8日（水）9:45〜10:15　Room 204-5」 */
      sessions: { when: string; lines: string[] }[];
    };

export type KaihoArticle = {
  slug: string;
  /** 特集名など（例: 特集 ClarinetFest®2026） */
  section?: string;
  /** 小見出し（例: 視察記／7月8日出演者） */
  kicker?: string;
  title: string;
  author: string;
  authorRole?: string;
  /** 誌面のページ番号（目次と対応） */
  page: number;
  hero?: KaihoImage;
  /** 記事冒頭のリード文（一般公開部分にも出る） */
  lead?: string;
  blocks: KaihoBlock[];
};

export type KaihoContentsItem = {
  page: number;
  title: string;
  note?: string;
  /** Web 版の記事がある場合のスラッグ */
  slug?: string;
};

export type KaihoIssue = {
  /** URL に使う号数（例: "175"） */
  number: string;
  /** 発行日 YYYY-MM-DD */
  issueDate: string;
  /** 表紙右上の英字（例: 2026 September） */
  issueMonthEn: string;
  /** 和暦の発行日表記（表紙下部） */
  issueDateJa: string;
  cover: {
    feature: string;
    featureSub?: string;
    band?: string;
    /** 表紙コラージュ（先頭が大きく出る） */
    images: KaihoImage[];
  };
  /** 特集の導入文（号のトップに出る） */
  intro?: string;
  contents: KaihoContentsItem[];
  articles: KaihoArticle[];
  credits: string;
};
