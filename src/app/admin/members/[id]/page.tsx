import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, User, Mail, CreditCard } from "lucide-react";
import { ResetPasswordButton } from "./reset-password-button";
import {
  buildMembershipFeeYearRows,
  type PaymentRowForFee,
} from "@/lib/membership-fee-status";
import { formatMemberNumber } from "@/lib/member-number";
import { unifiedPaymentMethodLabel, type ProfileForMemberCsv } from "@/lib/admin-members-csv";

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
      is_css_user, stripe_customer_id, source, import_payment_kind,
      memberships(join_date, expiry_date, payment_method)
    `;
  const selectBase = `
      id, user_id, member_number, name, name_kana, email, zip_code, address, phone,
      affiliation, status, membership_type, created_at,
      is_css_user, stripe_customer_id, source, import_payment_kind,
      memberships(join_date, expiry_date, payment_method)
    `;

  let { data: profile, error } = await admin
    .from("profiles")
    .select(selectFull)
    .eq("id", id)
    .single();

  if (
    error?.message?.includes("is_ica_member") ||
    error?.message?.includes("officer_title") ||
    error?.message?.includes("birth_date") ||
    error?.message?.includes("is_css_user") ||
    error?.message?.includes("stripe_customer_id") ||
    error?.message?.includes("source") ||
    error?.message?.includes("import_payment_kind") ||
    error?.message?.includes("column")
  ) {
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
  const profileExt = profile as {
    is_ica_member?: boolean;
    officer_title?: string | null;
    birth_date?: string | null;
    is_css_user?: boolean | null;
    stripe_customer_id?: string | null;
    source?: string | null;
    import_payment_kind?: string | null;
  };

  const profileForPaymentLabel: ProfileForMemberCsv = {
    id: profile.id,
    member_number: profile.member_number as number | null,
    name: profile.name ?? "",
    name_kana: profile.name_kana ?? "",
    email: profile.email ?? "",
    status: profile.status ?? "active",
    membership_type: profile.membership_type ?? "regular",
    is_ica_member: profileExt.is_ica_member ?? false,
    is_css_user: profileExt.is_css_user ?? false,
    stripe_customer_id: profileExt.stripe_customer_id ?? null,
    source: profileExt.source ?? null,
    import_payment_kind: profileExt.import_payment_kind ?? null,
    memberships,
  };

  const { data: feePayRows } = await admin
    .from("payments")
    .select("purpose, method, metadata, created_at")
    .eq("profile_id", id)
    .eq("purpose", "membership_fee");
  const membershipFeeYearRows = buildMembershipFeeYearRows(
    (feePayRows ?? []) as PaymentRowForFee[],
    latestMembership?.expiry_date,
    3
  );

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
              <dd className="font-medium">
                {formatMemberNumber(profile.member_number, "-")}
              </dd>
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
              <dt className="text-muted-foreground">会員資格の末日（4/1〜翌3/31）</dt>
              <dd className="font-medium">{latestMembership.expiry_date ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">会費支払い方法（一覧と同じ区分）</dt>
              <dd className="font-medium">{unifiedPaymentMethodLabel(profileForPaymentLabel)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">会員資格の登録がありません。</p>
        )}
      </div>

      <div className="rounded-lg border border-border bg-white p-6">
        <h2 className="mb-3 text-lg font-semibold text-navy">会費支払い状況（直近3年度）</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          会費の事業年度は2月1日〜翌年1月31日です。会員資格は4月1日〜翌3月31日で、有効期限は通常その会員年度の3月31日です。クレジット決済は「決済済み」、銀行振込（CSS）など事務局登録の入金や有効期限が会費年度末をカバーする場合は「支払い済み」と表示します。
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 pr-4 font-medium">年度</th>
              <th className="py-2 font-medium">状況</th>
            </tr>
          </thead>
          <tbody>
            {membershipFeeYearRows.map((row) => (
              <tr key={row.fiscal_year} className="border-b border-border/60">
                <td className="py-2 pr-4">{row.label}</td>
                <td className="py-2">
                  <span
                    className={
                      row.status === "未払い"
                        ? "rounded bg-amber-500/15 px-2 py-0.5 text-amber-900"
                        : row.status === "決済済み"
                          ? "rounded bg-green-500/15 px-2 py-0.5 text-green-800"
                          : "rounded bg-navy/10 px-2 py-0.5 text-navy"
                    }
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
      </div>
    </div>
  );
}
