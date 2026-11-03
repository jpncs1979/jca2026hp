import type { KaihoIssue } from "./types";
import { KAIHO_175 } from "./175";

/** Web 版のある号（新しい順） */
export const KAIHO_ISSUES: KaihoIssue[] = [KAIHO_175];

export function getKaihoIssue(number: string): KaihoIssue | undefined {
  return KAIHO_ISSUES.find((i) => i.number === number);
}

export type { KaihoIssue, KaihoArticle, KaihoBlock, KaihoImage } from "./types";
