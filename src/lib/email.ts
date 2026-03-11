/** 事務局メールの送信元（From）。すべての事務局発信メールで使用する */
export const OFFICE_FROM_EMAIL = "jca@jp-clarinet.org";
export const OFFICE_FROM_NAME = "日本クラリネット協会";

export const OFFICE_FROM_HEADER = `"${OFFICE_FROM_NAME}" <${OFFICE_FROM_EMAIL}>`;

/**
 * 実際にメール送信で使う From。
 * Gmail で送る場合は、認証アカウントと異なるアドレスだと拒否されることがあるため、
 * .env で EMAIL_FROM を指定可能（例: "日本クラリネット協会 <your@gmail.com>"）。
 */
export function getFromHeader(): string {
  const env = process.env.EMAIL_FROM;
  if (env && env.trim()) return env.trim();
  return OFFICE_FROM_HEADER;
}
