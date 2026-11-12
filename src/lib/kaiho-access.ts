import { requireValidMember } from "@/lib/member-access";

export type KaihoReader = {
  /** 記事を最後まで読めるか */
  full: boolean;
  /** 開発用の「会員表示」見本で開いているか */
  preview: boolean;
  /** 記事末尾に出す閲覧者表示（転送の抑止用） */
  readerLabel?: string;
};

/**
 * 会報 Web 版の閲覧権限。
 * - 有効な会員（ログイン済み・資格期限内）→ 全文
 * - それ以外 → 冒頭のみ
 * - 開発サーバー（npm run dev）に限り ?preview=member で会員表示を確認できる。本番では無効。
 */
/** 見本の「一般／会員」切り替えを使ってよい環境（開発サーバー、Vercel のプレビュー用URL）。本番では false */
export function isKaihoPreviewEnv(): boolean {
  return process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview";
}

export async function getKaihoReader(previewParam?: string | string[]): Promise<KaihoReader> {
  if (isKaihoPreviewEnv() && previewParam === "member") {
    return { full: true, preview: true, readerLabel: "見本 太郎 様（会員番号 0000）" };
  }
  try {
    const auth = await requireValidMember();
    if (auth.ok) {
      const no = auth.profile.member_number;
      const label = [
        auth.profile.name ? `${auth.profile.name} 様` : null,
        no != null ? `（会員番号 ${String(no).padStart(4, "0")}）` : null,
      ]
        .filter(Boolean)
        .join("");
      return { full: true, preview: false, readerLabel: label || undefined };
    }
  } catch {
    // ログイン基盤に接続できない場合は一般表示にする
  }
  return { full: false, preview: false };
}
