import type { SupabaseClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { getCompetitionFromHeader, OFFICE_FROM_EMAIL } from "@/lib/email";
import { ENSEMBLE_2027 } from "@/lib/ensemble-2027";
import {
  ENSEMBLE_2027_FINAL_FEE_COLUMNS,
  ensemble2027FinalUnitFee,
  verifyEnsemble2027FinalFeeToken,
  type Ensemble2027FinalFeeApplication,
} from "@/lib/ensemble-2027-final-fee";

export type FinalFeeLoadResult =
  | { ok: true; app: Ensemble2027FinalFeeApplication; unitFee: number }
  | { ok: false; message: string; status: number };

/** 支払いリンク（id＋署名）を確かめ、アンコンの審査料支払い済み申込を読み込む */
export async function loadEnsemble2027FinalFeeApplication(
  db: SupabaseClient,
  applicationId: string,
  token: string
): Promise<FinalFeeLoadResult> {
  if (!verifyEnsemble2027FinalFeeToken(applicationId, token)) {
    return { ok: false, message: "リンクが正しくありません。メールに記載のリンクをそのまま開いてください。", status: 403 };
  }

  const { data: comp } = await db
    .from("competitions")
    .select("id")
    .eq("slug", ENSEMBLE_2027.slug)
    .maybeSingle();

  const { data, error } = await db
    .from("applications")
    .select(ENSEMBLE_2027_FINAL_FEE_COLUMNS)
    .eq("id", applicationId)
    .maybeSingle();

  if (error || !data || !comp?.id || data.competition_id !== comp.id) {
    return { ok: false, message: "お申し込みが見つかりません。事務局までお問い合わせください。", status: 404 };
  }

  const app = data as unknown as Ensemble2027FinalFeeApplication;
  if (app.payment_status !== "paid") {
    return { ok: false, message: "動画審査料のお支払いが確認できていません。事務局までお問い合わせください。", status: 400 };
  }

  const unitFee = ensemble2027FinalUnitFee(app.category, app.member_type);
  if (unitFee == null) {
    return { ok: false, message: "部門の情報が正しくありません。事務局までお問い合わせください。", status: 400 };
  }

  return { ok: true, app, unitFee };
}

/** 本選参加料の支払い（または0円での参加確定）を記録する。既に記録済みなら何もしない */
export async function recordEnsemble2027FinalFee(
  db: SupabaseClient,
  applicationId: string,
  values: {
    status: "paid" | "free";
    amount: number;
    performerCount: number;
    paymentIntent?: string | null;
  }
): Promise<{ updated: boolean; error?: string }> {
  const { data, error } = await db
    .from("applications")
    .update({
      final_fee_status: values.status,
      final_fee_amount: values.amount,
      final_performer_count: values.performerCount,
      final_fee_paid_at: new Date().toISOString(),
      final_fee_payment_intent: values.paymentIntent ?? null,
    })
    .eq("id", applicationId)
    .is("final_fee_status", null)
    .select("id");

  if (error) return { updated: false, error: error.message };
  return { updated: (data ?? []).length > 0 };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** 本選参加料の完了メール（代表者＋事務局） */
export async function sendEnsemble2027FinalFeeEmail(opts: {
  app: Pick<Ensemble2027FinalFeeApplication, "id" | "name" | "email" | "category" | "member_type">;
  status: "paid" | "free";
  amount: number;
  performerCount: number;
  unitFee: number;
}): Promise<void> {
  const emailUser = process.env.EMAIL_USER;
  const emailAppPassword = process.env.EMAIL_APP_PASSWORD;
  if (!emailUser || !emailAppPassword) {
    console.warn("[アンコン本選参加料メール] EMAIL_USER / EMAIL_APP_PASSWORD 未設定のため送信しません");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: emailUser, pass: emailAppPassword.replace(/\s/g, "") },
  });
  const from = getCompetitionFromHeader();
  const compName = ENSEMBLE_2027.name;

  const details = [
    `<ul style="margin:0;padding-left:1.25em;line-height:1.6">`,
    `<li>申込ID：${escapeHtml(opts.app.id)}</li>`,
    `<li>団体名：${escapeHtml(opts.app.name)}</li>`,
    `<li>部門：${escapeHtml(opts.app.category)}（${escapeHtml(opts.app.member_type)}）</li>`,
    `<li>本選の演奏者数：${opts.performerCount}名</li>`,
    `<li>参加料：${opts.unitFee.toLocaleString("ja-JP")}円 × ${opts.performerCount}名 ＝ <strong>${opts.amount.toLocaleString("ja-JP")}円</strong></li>`,
    `<li>お支払い方法：${opts.status === "paid" ? "クレジットカード（Stripe）" : "お支払いなし（0円）"}</li>`,
    `</ul>`,
  ].join("\n");

  const to = opts.app.email?.trim();
  if (to) {
    await transporter.sendMail({
      from,
      to,
      replyTo: OFFICE_FROM_EMAIL,
      subject:
        opts.status === "paid"
          ? `【${compName}】本選参加料のお支払いが完了しました`
          : `【${compName}】本選への参加手続きが完了しました`,
      html: [
        `<p>${escapeHtml(opts.app.name)} 様</p>`,
        opts.status === "paid"
          ? `<p>${escapeHtml(compName)} 本選参加料のお支払いを確認しました。本選へのご参加手続きは完了です。</p>`
          : `<p>${escapeHtml(compName)} 本選への参加手続きが完了しました（参加料は0円のため、お支払いはありません）。</p>`,
        details,
        `<p>本選：${escapeHtml(ENSEMBLE_2027.schedule.final)}　${escapeHtml(ENSEMBLE_2027.schedule.finalVenue)}</p>`,
        `<p>ご不明な点がございましたら、事務局までお問い合わせください。</p>`,
        `<hr />`,
        `<p>一般社団法人 日本クラリネット協会事務局</p>`,
      ].join("\n"),
    });
  }

  const officeNotifyEmail = (process.env.OFFICE_NOTIFY_EMAIL ?? emailUser).trim();
  if (officeNotifyEmail) {
    try {
      await transporter.sendMail({
        from,
        to: officeNotifyEmail,
        replyTo: OFFICE_FROM_EMAIL,
        subject: `【事務局】${compName} 本選参加料 ${opts.status === "paid" ? "決済完了" : "0円で参加確定"}`,
        html: `<p>本選参加料の手続きが完了しました。</p>\n${details}\n<p>管理画面のコンクール申込一覧でご確認ください。</p>`,
      });
    } catch (err) {
      console.error("[アンコン本選参加料メール] 事務局宛送信失敗:", err);
    }
  }
}
