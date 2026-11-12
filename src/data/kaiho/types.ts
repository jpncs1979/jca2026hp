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
    }
  /** 箇条書き（お知らせの予定一覧など） */
  | { type: "list"; items: string[] }
  /** 開催概要などの「項目名：内容」の囲み */
  | { type: "facts"; title?: string; rows: { label: string; value: string[] }[] }
  /** 入賞者1人分（顔写真＋賞＋氏名＋所属＋本人コメント） */
  | {
      type: "winner";
      rank: string;
      name: string;
      /** 名前の読み（原稿にルビがある場合） */
      nameRuby?: string;
      affiliation?: string;
      photo?: KaihoImage;
      /** コメントの見出し（任意） */
      heading?: string;
      text: string[];
    }
  /** 入選者など名前（＋写真）だけの一覧 */
  | { type: "honorees"; label: string; people: { name: string; photo?: KaihoImage }[] };

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
  /** true なら会員でなくても全文を表示（協会からのお知らせ など） */
  public?: boolean;
  /** 記事末の筆者プロフィール */
  profile?: { photo?: KaihoImage; name: string; text: string };
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
    /** 表紙写真の説明（目次の「表紙の写真」） */
    caption?: string;
  };
  /** 特集の導入文（号のトップに出る） */
  intro?: string;
  contents: KaihoContentsItem[];
  articles: KaihoArticle[];
  credits: string;
};
