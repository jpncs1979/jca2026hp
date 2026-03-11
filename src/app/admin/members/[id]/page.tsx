import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, User, Mail, CreditCard } from "lucide-react";
import { ResetPasswordButton } from "./reset-password-button";
import { DeleteMemberButton } from "./delete-member-button";

const MEMBERSHIP_LABELS: Record<string, string> = {
  regular: "正会員",
  student: "学生会員",
  supporting: "賛助会員",
  friend: "会友",
};

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    notFound();
  }

  const admin = createAdminClient();
  const selectFull = `
      id, user_id, member_number, name, name_kana, email, zip_code, address, phone,
      affiliation, status, membership_type, is_ica_member, officer_title, birth_date, created_at,
      memberships(join_date, expiry_date, payment_method)
    `;
  const selectBase = `
      id, user_id, member_number, name, name_kana, email, zip_code, address, phone,
      affiliation, status, membership_type, created_at,
      memberships(join_date, expiry_date, payment_method)
    `;

  let { data: profile, error } = await admin
    .from("profiles")
    .select(selectFull)
    .eq("id", id)
    .single();

  if (error?.message?.includes("is_ica_member") || error?.message?.includes("officer_title") || error?.message?.includes("birth_date") || error?.message?.includes("column")) {
    const retry = await admin.from("profiles").select(selectBase).eq("id", id).single();
    profile = retry.data;
    error = retry.error;
  }

  if (error || !profile) {
    notFound();
  }

  const { data: adminProfile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .single();

  if (!adminProfile?.is_admin) {
    notFound();
  }

  const memberships = (profile.memberships as { join_date?: string; expiry_date?: string; payment_method?: string }[] | null) ?? [];
  const latestMembership = [...memberships].sort(
    (a, b) => (b.expiry_date ?? "").localeCompare(a.expiry_date ?? "")
  )[0];
  const profileExt = profile as { is_ica_member?: boolean; officer_title?: string | null; birth_date?: string | null };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/members"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-navy"
      >
        <ArrowLeft className="size-4" />
        会員一覧に戻る
      </Link>

      <h1 className="text-2xl font-bold text-navy">会員詳細</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <User className="size-5 text-gold" />
            基本情報
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">会員番号</dt>
              <dd className="font-medium">{profile.member_number ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">氏名</dt>
              <dd className="font-medium">
                {profile.name}
                {profile.name_kana && (
                  <span className="ml-2 text-muted-foreground">（{profile.name_kana}）</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">会員種別</dt>
              <dd>{MEMBERSHIP_LABELS[profile.membership_type] ?? profile.membership_type}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">ICA会員</dt>
              <dd>
                {profileExt.is_ica_member ? (
                  <span className="rounded bg-navy/10 px-2 py-0.5 text-sm font-medium text-navy">ICA会員</span>
                ) : (
                  <span className="text-muted-foreground">－</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">役員</dt>
              <dd>
                {profileExt.officer_title?.trim() ? (
                  <span className="rounded bg-gold/20 px-2 py-0.5 text-sm font-medium text-navy">{profileExt.officer_title.trim()}</span>
                ) : (
                  <span className="text-muted-foreground">－</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">生年月日</dt>
              <dd>{profileExt.birth_date ?? "－"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">ステータス</dt>
              <dd>
                <span
                  className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                    profile.status === "pending"
                      ? "bg-amber-100 text-amber-800"
                      : profile.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {profile.status === "pending" ? "承認待ち" : profile.status === "active" ? "有効" : "期限切れ"}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-border bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Mail className="size-5 text-gold" />
            連絡先
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">メールアドレス</dt>
              <dd>
                {profile.email ? (
                  <a
                    href={`mailto:${profile.email}`}
                    className="text-gold hover:underline"
                    suppressHydrationWarning
                  >
                    {profile.email}
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </dd>
            </div>
            {profile.phone && (
              <div>
                <dt className="text-muted-foreground">電話番号</dt>
                <dd>{profile.phone}</dd>
              </div>
            )}
            {profile.address && (
              <div>
                <dt className="text-muted-foreground">住所</dt>
                <dd>
                  {profile.zip_code && `${profile.zip_code} `}
                  {profile.address}
                </dd>
              </div>
            )}
            {profile.affiliation && (
              <div>
                <dt className="text-muted-foreground">所属</dt>
                <dd>{profile.affiliation}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <CreditCard className="size-5 text-gold" />
          会員資格・有効期限
        </h2>
        {latestMembership ? (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">有効期限</dt>
              <dd className="font-medium">{latestMembership.expiry_date ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">支払方法</dt>
              <dd>
                {latestMembership.payment_method === "css"
                  ? "CSS"
                  : latestMembership.payment_method === "stripe"
                    ? "クレジットカード"
                    : latestMembership.payment_method === "transfer"
                      ? "振込"
                      : latestMembership.payment_method ?? "-"}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">会員資格の登録がありません。</p>
        )}
      </div>

      <div className="rounded-lg border border-border bg-white p-6">
        <h2 className="mb-2 text-lg font-semibold">パスワード再設定メール</h2>
        <p className="mb-3 text-sm text-muted-foreground">パスワードを忘れた会員には、ここから再設定用メールを送信できます。会員本人がメールのリンクを開き、新しいパスワードを設定します。</p>
        <ResetPasswordButton
          profileId={profile.id}
          userId={(profile as { user_id?: string | null }).user_id ?? null}
          memberName={profile.name}
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <Link href={`/admin/members/${id}/edit`}>
          <button className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-gold-foreground hover:bg-gold-muted">
            編集する
          </button>
        </Link>
        <Link href="/admin/members">
          <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
            一覧に戻る
          </button>
        </Link>
        <DeleteMemberButton profileId={id} memberName={profile.name} />
      </div>
    </div>
  );
}
