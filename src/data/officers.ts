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
  { role: "会長", members: [{ name: "（役員名）", affiliation: "（所属）" }] },
  { role: "副会長", members: [{ name: "（役員名）", affiliation: "（所属）" }] },
  {
    role: "理事",
    members: [
      { name: "（役員名）", affiliation: "（所属）" },
      { name: "（役員名）", affiliation: "（所属）" },
      { name: "（役員名）", affiliation: "（所属）" },
    ],
  },
  { role: "監事", members: [{ name: "（役員名）", affiliation: "（所属）" }] },
];
