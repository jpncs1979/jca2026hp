import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getFromHeader } from "@/lib/email";
import nodemailer from "nodemailer";

function isIsoDate(d: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const t = Date.parse(d);
  return !Number.isNaN(t);
}

function recoveryRedirectTo(): string {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
  return `${siteUrl}/auth/callback?next=/auth/set-password`;
}

function extractActionLink(linkData: unknown): string | null {
  const props = (linkData as { properties?: { action_link?: string } })?.properties;
  const fromProps = props?.action_link;
  if (fromProps) return fromProps;
  return (linkData as { action_link?: string })?.action_link ?? null;
}

async function generateRecoveryLink(
  admin: ReturnType<typeof createAdminClient>,
  email: string
): Promise<
  | { ok: true; userId: string; actionLink: string }
  | { ok: false; error: string }
> {
  const redirectTo = recoveryRedirectTo();
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo, redirect_to: redirectTo },
  });
  if (linkError) {
    return { ok: false, error: linkError.message };
  }
  const userId = (linkData as { user?: { id?: string } })?.user?.id;
  const actionLink = extractActionLink(linkData);
  if (!userId || !actionLink) {
    return { ok: false, error: "リカバリリンクの生成に失敗しました。" };
  }
  let finalLink = actionLink;
  try {
    const url = new URL(finalLink);
    if (!url.searchParams.has("redirect_to")) {
      url.searchParams.set("redirect_to", redirectTo);
      finalLink = url.toString();
    }
  } catch {
    /* keep as-is */
  }
  return { ok: true, userId, actionLink: finalLink };
}

async function sendRecoveryMail(email: string, actionLink: string): Promise<string | null> {
  const emailUser = process.env.EMAIL_USER;
  const emailAppPassword = process.env.EMAIL_APP_PASSWORD;
  if (!emailUser || !emailAppPassword) {
    return "メール送信の設定がありません（EMAIL_USER / EMAIL_APP_PASSWORD）。";
  }
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailAppPassword.replace(/\s/g, ""),
    },
  });
  const html = `
      <p>日本クラリネット協会の会員として、再度マイページをご利用いただけるよう手続きが行われました。</p>
      <p>パスワードを設定するには、以下のリンクをクリックしてください。</p>
      <p><a href="${actionLink}" style="color: #b8860b; text-decoration: underline;">パスワードを設定する</a></p>
      <p>※このメールに心当たりがない場合は、事務局までご連絡ください。</p>
      <p>※リンクの有効期限は限られています。お早めに手続きをお願いします。</p>
      <hr>
      <p style="color: #666; font-size: 12px;">一般社団法人 日本クラリネット協会</p>
    `;
  try {
    await transporter.sendMail({
      from: getFromHeader(),
      to: email,
      subject: "【日本クラリネット協会】会員の復活・パスワードの設定",
      html,
    });
  } catch (e) {
    console.error("revive send mail:", e);
    return "メールの送信に失敗しました。";
  }
  return null;
}

/**
 * 期限切れ・強制退会の会員を有効化する。
 * - profiles.status を active にし、強制退会メタデータをクリア（可能なら）
 * - 最新の memberships の有効期限を更新（無ければ新規行）
 * - user_id が空のときは Auth にユーザーを紐付け（既存メールならリカバリで検出、なければ新規作成）
 * - send_login_email が true のとき、パスワード設定用リンクをメール送信
 *
 * 注意: auth.users 新規 INSERT 時のトリガー（handle_new_user）が、同一メールで profiles
 * を pending で二重 INSERT しうる。メール UNIQUE が無いと復活対象の user_id 更新が競合するため、
 * createUser 直後は「同じ user_id で id が異なる行」を削除してから本レコードを更新する。
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: profileId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "未認証" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: adminProfile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!adminProfile?.is_admin) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    let body: { expiry_date?: unknown; send_login_email?: unknown };
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const expiryRaw =
      typeof body.expiry_date === "string" ? body.expiry_date.trim().slice(0, 10) : "";
    if (!isIsoDate(expiryRaw)) {
      return NextResponse.json(
        { error: "有効期限 expiry_date（YYYY-MM-DD）が必要です。" },
        { status: 400 }
      );
    }

    const sendLoginEmail = body.send_login_email !== false;

    const { data: profile, error: fetchErr } = await admin
      .from("profiles")
      .select("id, status, user_id, email, name")
      .eq("id", profileId)
      .single();

    if (fetchErr || !profile) {
      return NextResponse.json({ error: "会員が見つかりません" }, { status: 404 });
    }

    const st = String(profile.status ?? "");
    if (st !== "expired" && st !== "expelled") {
      return NextResponse.json(
        { error: "期限切れまたは強制退会の会員のみ復活できます。" },
        { status: 400 }
      );
    }

    const email = String(profile.email ?? "").trim();
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "有効なメールアドレスが登録されていません。先に編集画面でメールを登録してください。" },
        { status: 400 }
      );
    }

    const name = String(profile.name ?? "").trim();

    let userId = profile.user_id as string | null;
    let recoveryLink: string | null = null;
    /** このリクエストで admin.createUser した Auth UID（トリガー重複 profiles の掃除用） */
    let authUserIdFromCreateUser: string | null = null;

    if (!userId) {
      const gl = await generateRecoveryLink(admin, email);
      if (gl.ok) {
        userId = gl.userId;
        recoveryLink = sendLoginEmail ? gl.actionLink : null;
      } else {
        const tempPass = randomBytes(20).toString("base64url") + "Aa1!#x";
        const { data: created, error: ce } = await admin.auth.admin.createUser({
          email,
          password: tempPass,
          email_confirm: true,
          user_metadata: { full_name: name || undefined, name: name || undefined },
        });
        if (ce || !created.user?.id) {
          const msg = ce?.message ?? "";
          const maybeDup =
            msg.toLowerCase().includes("already") ||
            msg.toLowerCase().includes("registered") ||
            (ce as { status?: number })?.status === 422;
          if (maybeDup) {
            const gl2 = await generateRecoveryLink(admin, email);
            if (gl2.ok) {
              userId = gl2.userId;
              recoveryLink = sendLoginEmail ? gl2.actionLink : null;
            } else {
              return NextResponse.json(
                {
                  error:
                    "このメールは既に Authentication に登録されていますが、紐付けに失敗しました。Supabase でユーザーを確認してください。",
                },
                { status: 409 }
              );
            }
          } else {
            return NextResponse.json(
              { error: msg || "ログイン用アカウントの作成に失敗しました。" },
              { status: 500 }
            );
          }
        } else {
          userId = created.user.id;
          authUserIdFromCreateUser = created.user.id;
          if (sendLoginEmail) {
            const gl3 = await generateRecoveryLink(admin, email);
            if (!gl3.ok) {
              return NextResponse.json(
                { error: gl3.error || "パスワード設定リンクの生成に失敗しました。" },
                { status: 500 }
              );
            }
            recoveryLink = gl3.actionLink;
          }
        }
      }
    } else if (sendLoginEmail) {
      const gl = await generateRecoveryLink(admin, email);
      if (!gl.ok) {
        return NextResponse.json({ error: gl.error }, { status: 500 });
      }
      recoveryLink = gl.actionLink;
    }

    if (authUserIdFromCreateUser) {
      const { error: delDupErr } = await admin
        .from("profiles")
        .delete()
        .eq("user_id", authUserIdFromCreateUser)
        .neq("id", profileId);
      if (delDupErr) {
        console.warn("revive: duplicate profile cleanup:", delDupErr);
      }
    }

    const { data: memList } = await admin
      .from("memberships")
      .select("id")
      .eq("profile_id", profileId)
      .order("expiry_date", { ascending: false })
      .limit(1);
    const latestId = memList?.[0]?.id as string | undefined;

    const memPatch = { expiry_date: expiryRaw, updated_at: new Date().toISOString() };
    if (latestId) {
      const { error: mErr } = await admin.from("memberships").update(memPatch).eq("id", latestId);
      if (mErr) {
        return NextResponse.json({ error: mErr.message }, { status: 500 });
      }
    } else {
      const join = new Date().toISOString().slice(0, 10);
      const { error: insErr } = await admin.from("memberships").insert({
        profile_id: profileId,
        join_date: join,
        expiry_date: expiryRaw,
        payment_method: "transfer",
      });
      if (insErr) {
        return NextResponse.json({ error: insErr.message }, { status: 500 });
      }
    }

    const nowIso = new Date().toISOString();
    const baseProfile: Record<string, unknown> = {
      status: "active",
      user_id: userId,
      updated_at: nowIso,
    };

    const withExpelClear: Record<string, unknown> = {
      ...baseProfile,
      expelled_at: null,
      expulsion_reason: null,
      email_before_rejoin_release: null,
    };

    let upErr = (await admin.from("profiles").update(withExpelClear).eq("id", profileId)).error;
    if (
      upErr &&
      (upErr.message?.includes("column") ||
        upErr.message?.includes("expelled_at") ||
        upErr.message?.includes("schema"))
    ) {
      upErr = (await admin.from("profiles").update(baseProfile).eq("id", profileId)).error;
    }

    if (upErr) {
      console.error("revive profile update:", upErr);
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    let mailWarning: string | null = null;
    if (sendLoginEmail && recoveryLink) {
      mailWarning = await sendRecoveryMail(email, recoveryLink);
    }

    return NextResponse.json({
      success: true,
      user_id_linked: Boolean(userId),
      mail_sent: sendLoginEmail && recoveryLink && !mailWarning,
      mail_warning: mailWarning,
    });
  } catch (err) {
    console.error("revive:", err);
    return NextResponse.json({ error: "復活処理に失敗しました。" }, { status: 500 });
  }
}
