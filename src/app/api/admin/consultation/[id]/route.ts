import { NextResponse } from "next/server";
import {
  buildAnswerMail,
  cleanPublicName,
  consentExpiryFrom,
  consentPageUrl,
  createConsentToken,
  planConsultationAdminAction,
  type AdminAction,
  type AdminWritablePatch,
} from "@/lib/consultation";
import { consultationMailReady, sendConsultationMail } from "@/lib/consultation-mail";
import { isCurrentUserAdmin } from "@/lib/is-current-user-admin";
import { resolvePublicSiteOrigin } from "@/lib/site-public-url";
import { createAdminClient } from "@/lib/supabase/server";

const RESPONSE_COLUMNS =
  "id, name, email, nickname, age, category, body, status, answer, published_at, created_at, publish_wanted, public_name, public_question, consent_status, consent_requested_at, consent_expires_at, consented_at, answer_sent_at";

const SNAPSHOT_COLUMNS = `${RESPONSE_COLUMNS}, consent_token_hash`;

const ACTIONS: AdminAction[] = ["save_draft", "send", "resend", "unpublish"];

type StoredQuestion = {
  id: string;
  name: string;
  email: string;
  publish_wanted: boolean;
  public_name: string | null;
  public_question: string | null;
  answer: string | null;
  status: string;
  published_at: string | null;
  answer_sent_at: string | null;
  consent_status: string;
  consent_token_hash: string | null;
  consent_requested_at: string | null;
  consent_expires_at: string | null;
};

function snapshotOf(row: StoredQuestion) {
  return {
    public_name: row.public_name,
    public_question: row.public_question,
    answer: row.answer,
    status: row.status,
    published_at: row.published_at,
    answer_sent_at: row.answer_sent_at,
    consent_status: row.consent_status,
    consent_token_hash: row.consent_token_hash,
    consent_requested_at: row.consent_requested_at,
    consent_expires_at: row.consent_expires_at,
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const action = body.action as AdminAction;
    if (!ACTIONS.includes(action)) {
      return NextResponse.json({ error: "操作を指定してください。" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: existing, error: readError } = await admin
      .from("consultation_questions")
      .select(SNAPSHOT_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (readError) {
      console.error("[admin/consultation] PATCH read error:", readError);
      return NextResponse.json({ error: readError.message }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: "質問が見つかりません。" }, { status: 404 });
    }

    const row = existing as StoredQuestion;
    const input = {
      publicName: cleanPublicName(typeof body.publicName === "string" ? body.publicName : row.public_name ?? ""),
      publicQuestion:
        typeof body.publicQuestion === "string" ? body.publicQuestion.trim() : (row.public_question ?? "").trim(),
      answer: typeof body.answer === "string" ? body.answer.trim() : (row.answer ?? "").trim(),
    };

    const now = new Date();
    const plan = planConsultationAdminAction(row, action, input, now.toISOString());
    if (!plan.ok) {
      return NextResponse.json({ error: plan.error }, { status: 400 });
    }

    if (plan.email !== "none" && !consultationMailReady()) {
      return NextResponse.json(
        { error: "メールの設定が不足しているため、送信できませんでした。" },
        { status: 500 }
      );
    }

    const patch: AdminWritablePatch = { ...plan.patch };
    let consentUrl: string | null = null;
    let expiresAt: Date | null = null;
    if (plan.email === "consent") {
      const issued = createConsentToken();
      expiresAt = consentExpiryFrom(now);
      const origin = resolvePublicSiteOrigin(request);
      consentUrl = consentPageUrl(origin, issued.token);
      patch.consent_token_hash = issued.hash;
      patch.consent_requested_at = now.toISOString();
      patch.consent_expires_at = expiresAt.toISOString();
      patch.consent_status = "requested";
    }

    const { error: updateError } = await admin.from("consultation_questions").update(patch).eq("id", id);
    if (updateError) {
      console.error("[admin/consultation] PATCH error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (plan.email !== "none") {
      try {
        const origin = resolvePublicSiteOrigin(request);
        const mail = buildAnswerMail({
          name: row.name,
          answer: input.answer,
          publishWanted: plan.email === "consent",
          publicName: input.publicName,
          publicQuestion: input.publicQuestion,
          consentUrl,
          expiresAt,
          origin,
        });
        await sendConsultationMail({
          to: row.email,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        });
      } catch (e) {
        const { error: rollbackError } = await admin
          .from("consultation_questions")
          .update(snapshotOf(row))
          .eq("id", id);
        console.error(
          "[admin/consultation] メール送信に失敗したため状態を戻しました:",
          e instanceof Error ? e.message : e,
          rollbackError ? `rollback: ${rollbackError.message}` : ""
        );
        return NextResponse.json(
          {
            error: rollbackError
              ? "メールを送れず、元の状態への戻しも失敗しました。事務局画面を読み直してください。"
              : "メールを送れなかったため、変更を取り消しました。",
          },
          { status: 500 }
        );
      }
    }

    const { data: saved, error: savedError } = await admin
      .from("consultation_questions")
      .select(RESPONSE_COLUMNS)
      .eq("id", id)
      .single();
    if (savedError || !saved) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ question: saved });
  } catch (e) {
    console.error("[admin/consultation] PATCH error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "更新に失敗しました。" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const admin = createAdminClient();
    const { error } = await admin.from("consultation_questions").delete().eq("id", id);
    if (error) {
      console.error("[admin/consultation] DELETE error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/consultation] DELETE error:", e);
    return NextResponse.json({ error: "削除に失敗しました。" }, { status: 500 });
  }
}
