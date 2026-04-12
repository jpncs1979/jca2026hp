/** 事務局メールの送信元（From）。すべての事務局発信メールで使用する */
export const OFFICE_FROM_EMAIL = "jca@jp-clarinet.org";
export const OFFICE_FROM_NAME = "日本クラリネット協会";

export const OFFICE_FROM_HEADER = `"${OFFICE_FROM_NAME}" <${OFFICE_FROM_EMAIL}>`;

/**
 * コンクール申込・振込証明など、申込者に届く「公開窓口」メールの From。
 * `EMAIL_FROM`（Gmail 表示用など）の影響を受けず、既定では jca@jp-clarinet.org を使う。
 * Gmail の「別のメールアドレスから送信」で jca を検証済みであることが前提。
 *
 * 上書きする場合のみ `COMPETITION_EMAIL_FROM` を設定（例: `"日本クラリネット協会" <jca@jp-clarinet.org>`）。
 */
export function getCompetitionFromHeader(): string {
  const env = process.env.COMPETITION_EMAIL_FROM;
  if (env && env.trim()) return env.trim();
  return OFFICE_FROM_HEADER;
}

/**
 * 入会・会員管理・管理画面など、コンクール以外の事務局発信メールの From。
 * Gmail で送る場合は認証アカウントと異なる From が拒否されることがあるため、
 * .env で EMAIL_FROM を指定可能（例: "日本クラリネット協会 <your@gmail.com>"）。
 */
export function getFromHeader(): string {
  const env = process.env.EMAIL_FROM;
  if (env && env.trim()) return env.trim();
  return OFFICE_FROM_HEADER;
}
