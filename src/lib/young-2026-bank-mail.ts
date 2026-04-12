import nodemailer from "nodemailer";
import { getCompetitionFromHeader, OFFICE_FROM_EMAIL } from "@/lib/email";
import {
  buildYoung2026ApplicationDetailsSection,
  parsedToMailFields,
  type Young2026ApplicationMailFields,
} from "@/lib/young-2026-application-mail-html";
import { resolvePublicSiteOrigin } from "@/lib/site-public-url";
import { YOUNG_2026 } from "@/lib/young-2026";
import type { Young2026ApplicationParsed } from "@/lib/young-2026-create-application";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** 銀行振込ルートで申込レコード作成直後（振込証明画像アップロード前） */
export async function sendYoungBankTransferPendingEmails(
  request: Request,
  p: Young2026ApplicationParsed,
  applicationId: string,
  amount: number,
  opts?: { clientOrigin?: string | null }
): Promise<void> {
  const emailUser = process.env.EMAIL_USER;
  const emailAppPassword = process.env.EMAIL_APP_PASSWORD;
  if (!emailUser || !emailAppPassword) {
    console.warn(
      "[ヤング振込申込メール] EMAIL_USER / EMAIL_APP_PASSWORD 未設定のため送信しません"
    );
    return;
  }

  const base = resolvePublicSiteOrigin(request, opts?.clientOrigin);
  const uploadUrl = `${base}/events/young-2026/apply/bank-transfer?application_id=${encodeURIComponent(applicationId)}`;
  const fromHeader = getCompetitionFromHeader();
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: emailUser, pass: emailAppPassword.replace(/\s/g, "") },
  });

  const name = escapeHtml(p.name);
  const amountStr = amount.toLocaleString("ja-JP");
  const mailFields = parsedToMailFields(p);
  const detailsHtml = buildYoung2026ApplicationDetailsSection(mailFields, {
    applicationId,
    amountYen: amount,
    paymentRouteLabel: "銀行振込・郵便振替（振込確認後に受付完了）",
  });

  const applicantHtml = `
    <p>${name} 様</p>
    <p>${escapeHtml(YOUNG_2026.name)}にお申し込みいただき、ありがとうございます。</p>
    <p>銀行振込（または郵便振替）をお選びいただきました。<strong>参加料 ${amountStr}円</strong>をお振込みのうえ、
    次のページから<strong>参加費のお振込が分かる証明（領収書または振込明細など）の画像</strong>を送付してください。</p>
    <p><a href="${uploadUrl}">${escapeHtml(uploadUrl)}</a></p>
    <p>※上記リンクから開くか、申込完了後の案内画面に従って<strong>振込証明の画像</strong>を送付してください。</p>
    ${detailsHtml}
    <p>ご不明な点は事務局までお問い合わせください。</p>
    <hr />
    <p>一般社団法人 日本クラリネット協会事務局</p>
  `;

  await transporter.sendMail({
    from: fromHeader,
    to: p.email,
    replyTo: OFFICE_FROM_EMAIL,
    subject: `【${YOUNG_2026.name}】参加費振込の証明画像の送付について`,
    html: applicantHtml,
  });
  console.log("[ヤング振込申込メール] 本人宛（手続き案内）送信", p.email);

  const officeNotifyEmail = (process.env.OFFICE_NOTIFY_EMAIL ?? emailUser).trim();
  if (officeNotifyEmail) {
    const officeDetails = buildYoung2026ApplicationDetailsSection(mailFields, {
      applicationId,
      amountYen: amount,
      paymentRouteLabel: "銀行振込・郵便振替（証明画像未）",
    });
    await transporter.sendMail({
      from: fromHeader,
      to: officeNotifyEmail,
      replyTo: OFFICE_FROM_EMAIL,
      subject: `【事務局】${YOUNG_2026.name} 銀行振込申込（証明画像未）`,
      html: `
        <p>ヤングコンクールの銀行振込申込がありました（参加費振込の証明画像は未送付の可能性があります）。</p>
        <p>証明画像アップロード用URL：<a href="${uploadUrl}">${escapeHtml(uploadUrl)}</a></p>
        ${officeDetails}
        <p>管理画面のコンクール申込一覧でご確認ください。</p>
      `,
    });
    console.log("[ヤング振込申込メール] 事務局宛送信", officeNotifyEmail);
  }
}

/** 振込証明画像アップロード完了後 */
export async function sendYoungBankTransferReceiptUploadedEmails(p: {
  email: string;
  name: string;
  applicationId: string;
  amount: number | null;
  /** 申込内容の全文（メール内確認用） */
  applicationFields: Young2026ApplicationMailFields;
}): Promise<void> {
  const emailUser = process.env.EMAIL_USER;
  const emailAppPassword = process.env.EMAIL_APP_PASSWORD;
  if (!emailUser || !emailAppPassword) {
    console.warn(
      "[ヤング振込証明メール] EMAIL_USER / EMAIL_APP_PASSWORD 未設定のため送信しません"
    );
    return;
  }

  const fromHeader = getCompetitionFromHeader();
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: emailUser, pass: emailAppPassword.replace(/\s/g, "") },
  });

  const name = escapeHtml(p.name);
  const detailsHtml = buildYoung2026ApplicationDetailsSection(p.applicationFields, {
    applicationId: p.applicationId,
    amountYen: p.amount,
    paymentRouteLabel: "銀行振込・郵便振替",
  });

  await transporter.sendMail({
    from: fromHeader,
    to: p.email,
    replyTo: OFFICE_FROM_EMAIL,
    subject: `【${YOUNG_2026.name}】参加費振込の証明画像を受け付けました`,
    html: `
      <p>${name} 様</p>
      <p>参加費振込の証明（領収書または振込明細など）の画像を受け付けました。事務局で入金を確認後、改めてご連絡する場合があります。</p>
      ${detailsHtml}
      <p>ご不明な点は事務局までお問い合わせください。</p>
      <hr />
      <p>一般社団法人 日本クラリネット協会事務局</p>
    `,
  });
  console.log("[ヤング振込証明メール] 本人宛送信", p.email);

  const officeNotifyEmail = (process.env.OFFICE_NOTIFY_EMAIL ?? emailUser).trim();
  if (officeNotifyEmail) {
    await transporter.sendMail({
      from: fromHeader,
      to: officeNotifyEmail,
      replyTo: OFFICE_FROM_EMAIL,
      subject: `【事務局】${YOUNG_2026.name} 証明画像アップロード済`,
      html: `
        <p>申込ID ${escapeHtml(p.applicationId)} の参加費振込の証明画像がアップロードされました。</p>
        ${detailsHtml}
        <p>管理画面から証明画像を確認してください。</p>
      `,
    });
    console.log("[ヤング振込証明メール] 事務局宛送信", officeNotifyEmail);
  }
}
