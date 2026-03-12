/**
 * 役員名簿（協会案内ページ用）
 * 更新時はこのファイルを編集してください
 */

export interface OfficerMember {
  name: string;
  affiliation?: string;
}

export interface OfficerGroup {
  role: string;
  members: OfficerMember[];
}

export const officers: OfficerGroup[] = [
  { role: "会長", members: [{ name: "四戸世紀" }] },
  { role: "副会長", members: [{ name: "三界秀実" }, { name: "藤井洋子" }] },
  { role: "理事長", members: [{ name: "下澤達雄", affiliation: "代表理事" }] },
  { role: "副理事長", members: [{ name: "大和田智彦" }, { name: "河﨑卓" }] },
  { role: "特別顧問", members: [{ name: "古屋圭司" }] },
  { role: "名誉会員", members: [{ name: "ロルフ・アイヒラ―" }] },
  { role: "会友", members: [{ name: "北村英治" }, { name: "坂田 明" }] },
  {
    role: "永久名誉会長",
    members: [
      { name: "北爪利世" },
      { name: "千葉国夫" },
      { name: "大橋幸夫" },
      { name: "濵中浩一" },
    ],
  },
  { role: "名誉会長", members: [{ name: "山本正治" }] },
  {
    role: "常務理事",
    members: [
      { name: "大浦綾子", affiliation: "国際交流副委員長" },
      { name: "大塚精治", affiliation: "総務担当" },
      { name: "金子理志", affiliation: "法務担当" },
      { name: "川井夏香", affiliation: "広報副委員長" },
      { name: "瀬戸良明", affiliation: "事務局次長" },
      { name: "谷口英治", affiliation: "事業副委員長" },
      { name: "野田祐介", affiliation: "事業副委員長" },
      { name: "橋本眞介", affiliation: "事業委員長" },
      { name: "馬場園真吾", affiliation: "財務委員長" },
      { name: "横田揺子", affiliation: "広報委員長・事務局次長" },
    ],
  },
  {
    role: "理事",
    members: [
      { name: "新井清史" },
      { name: "有馬理絵" },
      { name: "磯部周平" },
      { name: "伊藤寛隆" },
      { name: "伊藤めぐみ" },
      { name: "大浦綾子" },
      { name: "大塚精治" },
      { name: "大和田智彦" },
      { name: "勝山大舗" },
      { name: "加藤慎一" },
      { name: "金子理志" },
      { name: "鎌田浩志" },
      { name: "川井夏香" },
      { name: "河﨑卓" },
      { name: "こいけたかし" },
      { name: "四戸世紀" },
      { name: "嶋田博志" },
      { name: "下澤達雄" },
      { name: "白川毅夫" },
      { name: "菅生千穂" },
      { name: "鈴木歩" },
      { name: "関根悠乎" },
      { name: "関谷佳典" },
      { name: "瀬戸良明" },
      { name: "高子由佳" },
      { name: "高橋貞春" },
      { name: "武田忠善" },
      { name: "谷口英治" },
      { name: "豊永美恵" },
      { name: "二宮和子" },
      { name: "野田祐介" },
      { name: "橋本眞介" },
      { name: "畑中真理" },
      { name: "馬場園真吾" },
      { name: "昼田純一" },
      { name: "藤井洋子" },
      { name: "古澤嗣佳子" },
      { name: "松本健司" },
      { name: "三浦幸二" },
      { name: "三界秀実" },
      { name: "満江菜穂子" },
      { name: "三戸久史" },
      { name: "持丸秀一郎" },
      { name: "山本正治" },
      { name: "横田揺子" },
    ],
  },
  { role: "監事", members: [{ name: "鈴木康行" }] },
  {
    role: "事務局",
    members: [
      { name: "大和田智彦", affiliation: "事務局長" },
      { name: "瀬戸良明", affiliation: "事務局次長" },
      { name: "横田揺子", affiliation: "事務局次長" },
    ],
  },
  {
    role: "特別賛助会員",
    members: [
      { name: "野中貿易株式会社" },
      { name: "株式会社ビュッフェ・クランポン・ジャパン" },
      { name: "株式会社ヤマハミュージックジャパン" },
    ],
  },
  {
    role: "賛助会員",
    members: [
      { name: "アルソ出版株式会社" },
      { name: "株式会社石森管楽器" },
      { name: "ザ クラリネット ショップ" },
      { name: "株式会社セントラル楽器" },
      { name: "株式会社ダク" },
      { name: "株式会社美ら音工房ヨーゼフ" },
      { name: "株式会社ドルチェ楽器" },
      { name: "ナイス・インターナショナル" },
      { name: "株式会社山野楽器" },
    ],
  },
];
