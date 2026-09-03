/**
 * 第15回ヤング・クラリネッティストコンクール（2026）本選結果
 * ※同順位内の並びはあいうえお順
 *
 * 写真: public/images/young-2026/results/portraits/{photoId}.jpg
 * （元写真を顔まわりにトリミングしたもの）
 */

export type Young2026ResultCategory =
  | "ジュニアA部門"
  | "ジュニアB部門"
  | "ヤング・アーティスト部門";

export type Young2026ResultEntry = {
  category: Young2026ResultCategory;
  rank: string;
  name: string;
  award?: string;
  displayOrder?: number;
  /** public/images/young-2026/results/portraits/{photoId}.jpg */
  photoId?: string;
  photoSrc?: string;
};

export const YOUNG_2026_RESULTS = {
  edition: 15,
  year: 2026,
  publishedLabel: "2026年8月27日",
  venue: "パルテノン多摩 小ホール",
  entries: [
    // ジュニアA部門
    { category: "ジュニアA部門", rank: "金賞", name: "浦松　海渡", displayOrder: 1, photoId: "a02" },
    { category: "ジュニアA部門", rank: "金賞", name: "松坂　奏良", displayOrder: 2, photoId: "a07" },
    { category: "ジュニアA部門", rank: "金賞", name: "山内　咲空", displayOrder: 3, photoId: "a08" },
    { category: "ジュニアA部門", rank: "金賞", name: "吉國　希望", displayOrder: 4, photoId: "a09" },
    { category: "ジュニアA部門", rank: "金賞", name: "劉　子辰", displayOrder: 5, photoId: "a10" },
    { category: "ジュニアA部門", rank: "銀賞", name: "菊池　萌可", displayOrder: 1, photoId: "a03" },
    { category: "ジュニアA部門", rank: "銀賞", name: "小松　季愛", displayOrder: 2, photoId: "a04" },
    { category: "ジュニアA部門", rank: "銀賞", name: "髙塚　美里", displayOrder: 3, photoId: "a06" },
    { category: "ジュニアA部門", rank: "銅賞", name: "石井　杜和", displayOrder: 1, photoId: "a01" },
    { category: "ジュニアA部門", rank: "銅賞", name: "白谷　星", displayOrder: 2, photoId: "a05" },

    // ジュニアB部門
    { category: "ジュニアB部門", rank: "1位", name: "宮崎　夏維", photoId: "b06" },
    { category: "ジュニアB部門", rank: "2位", name: "小西　真優", displayOrder: 1, photoId: "b18" },
    { category: "ジュニアB部門", rank: "2位", name: "森田　芳明", displayOrder: 2, photoId: "b01" },
    { category: "ジュニアB部門", rank: "4位", name: "フォーグラー　華", photoId: "b03" },
    { category: "ジュニアB部門", rank: "5位", name: "鈴木　愛奈", photoId: "b11" },
    { category: "ジュニアB部門", rank: "6位", name: "河合　祐奈", photoId: "b14" },
    { category: "ジュニアB部門", rank: "入選", name: "青木　香織", displayOrder: 1, photoId: "b08" },
    { category: "ジュニアB部門", rank: "入選", name: "石田　ひなた", displayOrder: 2, photoId: "b20" },
    { category: "ジュニアB部門", rank: "入選", name: "小野崎　あずさ", displayOrder: 3, photoId: "b15" },
    { category: "ジュニアB部門", rank: "入選", name: "小村　優奈", displayOrder: 4, photoId: "b17" },
    { category: "ジュニアB部門", rank: "入選", name: "栗巢野　瑛", displayOrder: 5, photoId: "b07" },
    { category: "ジュニアB部門", rank: "入選", name: "小岩　花佳", displayOrder: 6, photoId: "b19" },
    { category: "ジュニアB部門", rank: "入選", name: "齋藤　悠誠", displayOrder: 7, photoId: "b16" },
    { category: "ジュニアB部門", rank: "入選", name: "シール　真莉亜", displayOrder: 8, photoId: "b23" },
    { category: "ジュニアB部門", rank: "入選", name: "高木　凛子", displayOrder: 9, photoId: "b05" },
    { category: "ジュニアB部門", rank: "入選", name: "髙塩　蘭", displayOrder: 10, photoId: "b12" },
    { category: "ジュニアB部門", rank: "入選", name: "中嶋　雄之介", displayOrder: 11, photoId: "b21" },
    { category: "ジュニアB部門", rank: "入選", name: "藤野　ことの", displayOrder: 12, photoId: "b02" },
    { category: "ジュニアB部門", rank: "入選", name: "宮永　悠希", displayOrder: 13, photoId: "b04" },
    { category: "ジュニアB部門", rank: "入選", name: "村松　和香", displayOrder: 14, photoId: "b22" },
    { category: "ジュニアB部門", rank: "入選", name: "山口　詩織", displayOrder: 15, photoId: "b10" },
    { category: "ジュニアB部門", rank: "入選", name: "吉田　麻実", displayOrder: 16, photoId: "b09" },
    { category: "ジュニアB部門", rank: "入選", name: "吉村　咲愛", displayOrder: 17, photoId: "b13" },

    // ヤング・アーティスト部門
    { category: "ヤング・アーティスト部門", rank: "1位", name: "守谷　日菜乃", photoId: "y03" },
    { category: "ヤング・アーティスト部門", rank: "2位", name: "遠藤　茉央", photoId: "y04" },
    { category: "ヤング・アーティスト部門", rank: "3位", name: "山田　悠葵", photoId: "y02" },
    { category: "ヤング・アーティスト部門", rank: "入選", name: "岡田　菜沙", displayOrder: 1, photoId: "y01" },
    { category: "ヤング・アーティスト部門", rank: "入選", name: "鈴木　かえ", displayOrder: 2, photoId: "y06" },
    { category: "ヤング・アーティスト部門", rank: "入選", name: "山中　遙", displayOrder: 3, photoId: "y07" },
    { category: "ヤング・アーティスト部門", rank: "入選", name: "山本　葵子", displayOrder: 4, photoId: "y05" },
  ] as Young2026ResultEntry[],
};
