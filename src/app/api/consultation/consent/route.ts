import { NextResponse } from "next/server";
import { adminQuestionUrl, buildOfficeDecisionMail, isConsentTokenShape } from "@/lib/consultation";
import { findConsentRow } from "@/lib/consultation-consent.server";
import { officeNotifyAddress, sendConsultationMail } from "@/lib/consultation-mail";
import { resolvePublicSiteOrigin } from "@/lib/site-public-url";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const KIND_MESSAGE = {
  not_found: "このリンクは無効です。期限が切れているか、新しいメールのリンクに置き換わっていることがあります。",
  expired: "このリンクの期限が切れています。掲載はしません。",
  used: "このリンクはすでに使われています。",
} as const;

/**
 * リンクを開いただけでは状態を変えない。ボタンを押した POST のときだけ掲載の可否を記録する。
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body.token ?? "");
    const decision = body.decision === "approve" || body.decision === "decline" ? body.decision : null;
    if (!decision || !isConsentTokenShape(token)) {
      return NextResponse.json({ ok: false, kind: "not_found", error: KIND_MESSAGE.not_found }, { status: 400 });
    }

    const found = await findConsentRow(token);
    if (found.view.kind !== "ready" || !found.row) {
      const kind = found.view.kind === "ready" ? "not_found" : found.view.kind;
      return NextResponse.json(
        { ok: false, kind, error: KIND_MESSAGE[kind === "used" ? "used" : kind] },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const patch =
      decision === "approve"
        ? {
            status: "published",
            published_at: now,
            consented_at: now,
            consent_status: "approved",
          }
        : {
            status: "declined",
            published_at: null,
            consent_status: "declined",
          };

    const admin = createAdminClient();
    const { data: updated, error } = await admin
      .from("consultation_questions")
      .update(patch)
      .eq("id", found.row.id)
      .eq("status", "awaiting_consent")
      .eq("consent_status", "requested")
      .eq("consent_token_hash", found.row.consent_token_hash)
      .gt("consent_expires_at", now)
      .select("id, public_name")
      .maybeSingle();

    if (error) {
      console.error("[相談室] consent update error:", error.message);
      return NextResponse.json({ ok: false, error: "記録に失敗しました。しばらくしてからお試しください。" }, { status: 500 });
    }
    if (!updated) {
      const again = await findConsentRow(token);
      const kind = again.view.kind === "ready" ? "used" : again.view.kind;
      return NextResponse.json({ ok: false, kind, error: KIND_MESSAGE[kind] }, { status: 400 });
    }

    await notifyOffice({
      origin: resolvePublicSiteOrigin(request),
      id: updated.id,
      publicName: updated.public_name ?? "",
      decision,
    });

    return NextResponse.json({ ok: true, result: decision === "approve" ? "approved" : "declined" });
  } catch (e) {
    console.error("[相談室] consent POST error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "記録に失敗しました。しばらくしてからお試しください。" }, { status: 500 });
  }
}

async function notifyOffice(input: {
  origin: string;
  id: string;
  publicName: string;
  decision: "approve" | "decline";
}) {
  const to = officeNotifyAddress();
  if (!to) {
    console.error("[相談室] 事務局への承諾通知を省略しました");
    return;
  }
  const mail = buildOfficeDecisionMail({
    publicName: input.publicName,
    decision: input.decision === "approve" ? "approved" : "declined",
    adminUrl: adminQuestionUrl(input.origin, input.id),
  });
  try {
    await sendConsultationMail({ to, subject: mail.subject, html: mail.html, text: mail.text });
  } catch (e) {
    console.error("[相談室] 承諾の通知メールに失敗しました:", e instanceof Error ? e.message : e);
  }
}
