import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getFromHeader } from "@/lib/email";
import nodemailer from "nodemailer";

/** 1回のリクエストで送信できる最大件数（Gmail: 個人500通/日、連続送信のレート制限対策） */
const MAX_EMAILS_PER_REQUEST = 100;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function parsePayload(body: Record<string, unknown> | FormData): {
  profile_ids?: string[];
  ica_only?: boolean;
  membership_type?: string;
  unpaid_only?: boolean;
  subject: string;
  email_body: string;
  preview?: boolean;
} {
  if (body instanceof FormData) {
    const profileIdsRaw = body.get("profile_ids");
    return {
      profile_ids: profileIdsRaw ? JSON.parse(String(profileIdsRaw)) : undefined,
      ica_only: body.get("ica_only") === "true",
      membership_type: (body.get("membership_type") as string) || undefined,
      unpaid_only: body.get("unpaid_only") === "true",
      subject: String(body.get("subject") ?? ""),
      email_body: String(body.get("email_body") ?? ""),
      preview: body.get("preview") === "true",
    };
  }
  const b = body as Record<string, unknown>;
  return {
    profile_ids: b.profile_ids as string[] | undefined,
    ica_only: b.ica_only as boolean | undefined,
    membership_type: b.membership_type as string | undefined,
    unpaid_only: b.unpaid_only as boolean | undefined,
    subject: String(b.subject ?? ""),
    email_body: String(b.email_body ?? ""),
    preview: b.preview as boolean | undefined,
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "未認証" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    const isFormData = contentType.includes("multipart/form-data");
    const body = isFormData ? await request.formData() : await request.json();
    const {
      profile_ids,
      ica_only,
      membership_type,
      unpaid_only,
      subject,
      email_body,
      preview,
    } = parsePayload(body as FormData | Record<string, unknown>);

    if (!subject?.trim() || !email_body?.trim()) {
      return NextResponse.json(
        { error: "件名と本文を入力してください" },
        { status: 400 }
      );
    }

    const isPreview = preview === true;

    const selectBase = "id, name, email, membership_type, memberships(expiry_date)";
    const selectWithIca = `${selectBase}, is_ica_member`;

    let q = admin
      .from("profiles")
      .select(Array.isArray(profile_ids) && profile_ids.length > 0 ? selectBase : selectWithIca)
      .or("is_admin.eq.false,is_admin.is.null")
      .not("email", "is", null);

    if (Array.isArray(profile_ids) && profile_ids.length > 0) {
      q = q.in("id", profile_ids);
    } else {
      if (ica_only) q = q.eq("is_ica_member", true);
      if (membership_type) q = q.eq("membership_type", membership_type);
    }

    let { data: profiles, error } = await q;

    if (error) {
      const msg = String(error?.message ?? "");
      if (msg.includes("is_ica_member") || msg.includes("column")) {
        q = admin
          .from("profiles")
          .select(selectBase)
          .or("is_admin.eq.false,is_admin.is.null")
          .not("email", "is", null);
        if (Array.isArray(profile_ids) && profile_ids.length > 0) {
          q = q.in("id", profile_ids);
        } else {
          if (membership_type) q = q.eq("membership_type", membership_type);
        }
        const retry = await q;
        profiles = retry.data;
        error = retry.error;
      }
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    let list = profiles ?? [];
    if (unpaid_only) {
      const today = new Date().toISOString().slice(0, 10);
      list = list.filter((p: { memberships?: { expiry_date?: string }[] | null }) => {
        const exp = p.memberships?.[0]?.expiry_date;
        return !exp || exp < today;
      });
    }

    const recipients = (list as { name?: string; email?: string }[])
      .filter((p) => p.email && p.email.includes("@"))
      .map((p) => ({ name: String(p.name ?? "").trim() || "会員", email: p.email! }));

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "送信対象の会員がいません" },
        { status: 400 }
      );
    }

    if (recipients.length > MAX_EMAILS_PER_REQUEST) {
      return NextResponse.json(
        { error: `一度に送信できるのは ${MAX_EMAILS_PER_REQUEST} 件までです。${recipients.length} 件のうち ${MAX_EMAILS_PER_REQUEST} 件を選択するか、条件を絞り込んでください。（Gmail 個人アカウントは1日500通まで）` },
        { status: 400 }
      );
    }

    const replaceName = (body: string, name: string) =>
      body.replace(/\{\{氏名\}\}/g, name).replace(/\{\{name\}\}/gi, name);

    if (isPreview) {
      const trimmed = email_body.trim();
      const sampleBody = replaceName(trimmed.slice(0, 300), recipients[0]?.name ?? "{{氏名}}");
      return NextResponse.json({
        preview: true,
        count: recipients.length,
        subject: subject.trim(),
        body_preview: sampleBody + (trimmed.length > 300 ? "..." : ""),
        recipients_sample: recipients.slice(0, 5).map((r) => `${r.name} <${r.email}>`),
      });
    }

    const emailUser = process.env.EMAIL_USER;
    const emailAppPassword = process.env.EMAIL_APP_PASSWORD;
    if (!emailUser || !emailAppPassword) {
      return NextResponse.json(
        { error: "メール送信の設定がありません。EMAIL_USER と EMAIL_APP_PASSWORD を設定してください。" },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailAppPassword.replace(/\s/g, ""),
      },
    });

    const formData = isFormData ? (body as FormData) : null;
    let attachments: { filename: string; content: Buffer }[] = [];
    if (formData) {
      const files = formData.getAll("attachments") as Blob[];
      for (const f of files) {
        if (f && "name" in f && (f as File).name && "arrayBuffer" in f) {
          const buf = Buffer.from(await (f as File).arrayBuffer());
          attachments.push({ filename: (f as File).name, content: buf });
        }
      }
    }

    // HTML対応: 既にタグがあればそのまま、なければ改行を<br>に
    const toHtml = (text: string) =>
      /<[a-z][\s\S]*>/i.test(text) ? text : text.replace(/\n/g, "<br>");
    const wrapHtml = (content: string) =>
      `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${content}</body></html>`;

    let sent = 0;
    for (let i = 0; i < recipients.length; i++) {
      const { name, email } = recipients[i];
      const personalBody = replaceName(email_body.trim(), name);
      const htmlContent = wrapHtml(toHtml(personalBody));
      try {
        await transporter.sendMail({
          from: getFromHeader(),
          to: email,
          subject: subject.trim(),
          html: htmlContent,
          attachments: attachments.length > 0 ? attachments : undefined,
        });
        sent++;
      } catch (err) {
        console.error(`Email to ${email} failed:`, err);
      }
      if (i < recipients.length - 1) await sleep(100);
    }

    return NextResponse.json({
      success: true,
      sent,
      total: recipients.length,
    });
  } catch (err) {
    console.error("Send email error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "メール送信に失敗しました" },
      { status: 500 }
    );
  }
}
