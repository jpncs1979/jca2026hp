/**
 * DB の selected_piece_preliminary / selected_piece_final は部門共通列だが、
 * 意味が部門ごとに異なる（ヤングの第2列は「本選」ではなく「第二次予選」）。
 */

/** 確認画面・メール等の<dt>用（部門ごとに正確な文言） */
export function young2026PiecePreliminaryLabel(category: string): string {
  if (category === "ヤング") return "第一次予選の課題曲";
  if (category === "ジュニアA" || category === "ジュニアB") return "予選の課題曲";
  return "予選・課題曲";
}

/** 確認画面・メール等の<dt>用（部門ごとに正確な文言） */
export function young2026PieceFinalLabel(category: string): string {
  if (category === "ヤング") return "第二次予選の課題曲";
  if (category === "ジュニアB" || category === "ジュニアA") return "本選の課題曲";
  return "本選・二次予選の課題曲";
}

/** 一覧表の列見出し（部門混在のため、ジュニア・ヤングの両方を示す） */
export function young2026PiecePreliminaryColumnHeader(): string {
  return "予選／第一次予選";
}

export function young2026PieceFinalColumnHeader(): string {
  return "本選／第二次予選";
}

/** CSV 列名（1行ヘッダのため、両部門の意味を併記） */
export function young2026PiecePreliminaryCsvHeader(): string {
  return "予選（ジュニア）・第一次予選（ヤング）の課題曲";
}

export function young2026PieceFinalCsvHeader(): string {
  return "本選（ジュニアB）・第二次予選（ヤング）の課題曲";
}
