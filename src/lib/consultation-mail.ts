import nodemailer from "nodemailer";
import { getFromHeader, OFFICE_FROM_EMAIL } from "@/lib/email";

export function consultationMailReady(): boolean {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD);
}

export function officeNotifyAddress(): string | null {
  const to = process.env.OFFICE_NOTIFY_EMAIL || process.env.EMAIL_USER;
  return to?.trim() || null;
}

export async function sendConsultationMail(message: {
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const emailUser = process.env.EMAIL_USER;
  const emailAppPassword = process.env.EMAIL_APP_PASSWORD;
  if (!emailUser || !emailAppPassword) {
    throw new Error("メールの設定が不足しています。");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailAppPassword.replace(/\s/g, ""),
    },
  });

  await transporter.sendMail({
    from: getFromHeader(),
    to: message.to,
    replyTo: message.replyTo ?? OFFICE_FROM_EMAIL,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
}
