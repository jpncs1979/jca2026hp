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
import { YOUNG_2026 } from "@/lib/young-2026";
import { joinAddressLine } from "@/lib/japanese-address";
import { EXPEL_REASON_THREE_YEAR_ARREARS } from "@/lib/membership-three-year-arrears";
import { ReleaseRejoinEmailButton } from "./release-rejoin-email-button";
import { MemberReviveButton } from "./member-revive-button";
import { MemberApproveButton } from "./member-approve-button";

const MEMBERSHIP_LABELS: Record<string, string> = {
  regular: "正会員",
  student: "学生会員",
  supporting: "賛助会員",
  friend: "会友",
};

/** 復活ダイアログの会員資格の末日の初期値 */
function suggestReviveExpiry(latestExpiry: string | undefined): string {
  const today = new Date().toISOString().slice(0, 10);
  if (
    latestExpiry &&
    /^\d{4}-\d{2}-\d{2}$/.test(latestExpiry) &&
    latestExpiry >= today
  ) {
    return latestExpiry;
  }
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

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
      id, user_id, member_number, name, name_kana, email, zip_code, address,
      address_prefecture, address_city, address_street, address_building,
      phone,
      affiliation, status, membership_type, is_ica_member, officer_title, birth_date, created_at,
      is_css_user, stripe_customer_id, source, import_payment_kind, simultaneous_join_competition_slug,
      expelled_at, expulsion_reason, email_before_rejoin_release,
      memberships(join_date, expiry_date, payment_method)
    `;
  /** 新カラム未マイグレーション時のフォールバック（simultaneous_join_competition_slug は含めない） */
  const selectBase = `
      id, user_id, member_number, name, name_kana, email, zip_code, address,
      address_prefecture, address_city, address_street, address_building,
      phone,
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
    error?.message?.includes("simultaneous_join_competition_slug") ||
    error?.message?.includes("expelled_at") ||
    error?.message?.includes("expulsion_reason") ||
    error?.message?.includes("email_before_rejoin_release") ||
    error?.message?.includes("address_prefecture") ||
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
    simultaneous_join_competition_slug?: string | null;
  };

  const sjSlug = profileExt.simultaneous_join_competition_slug?.trim() ?? "";
  const simultaneousJoinLabel =
    sjSlug === ""
      ? ""
      : sjSlug === YOUNG_2026.slug
        ? YOUNG_2026.name
        : sjSlug;

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
                        : profile.status === "expelled"
                          ? "bg-red-100 text-red-900"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {profile.status === "pending"
                    ? "承認待ち"
                    : profile.status === "active"
                      ? "有効"
                      : profile.status === "expelled"
                        ? "強制退会"
                        : "期限切れ"}
                </span>
              </dd>
            </div>
            {profile.status === "pending" ? (
              <div className="mt-4">
                <MemberApproveButton
                  profileId={profile.id}
                  memberName={profile.name ?? "会員"}
                />
              </div>
            ) : null}
            {simultaneousJoinLabel ? (
              <div>
                <dt className="text-muted-foreground">コンクール経由の同時入会</dt>
                <dd className="font-medium text-navy">{simultaneousJoinLabel}</dd>
              </div>
            ) : null}
          </dl>
          {profile.status === "expelled" ? (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-950">
              <p className="font-medium">会費未納等により強制退会となっています。</p>
              {(profile as { expelled_at?: string | null }).expelled_at ? (
                <p className="mt-1 text-xs text-red-900/90">
                  処理日時:{" "}
                  {new Date(
                    String((profile as { expelled_at?: string }).expelled_at)
                  ).toLocaleString("ja-JP")}
                </p>
              ) : null}
              {(profile as { expulsion_reason?: string | null }).expulsion_reason ===
              EXPEL_REASON_THREE_YEAR_ARREARS ? (
                <p className="mt-1 text-xs">理由: 事業年度ベースで直近3年連続の会費未納</p>
              ) : (profile as { expulsion_reason?: string | null }).expulsion_reason ? (
                <p className="mt-1 text-xs">
                  理由: {(profile as { expulsion_reason?: string }).expulsion_reason}
                </p>
              ) : null}
              <p className="mt-2 text-xs leading-relaxed">
                本人がウェブから再入会する場合は、事務局で内容確認のうえ、下のボタンでログイン用メールを退避してください。退避後、本人は同じメールアドレスで入会申し込みからやり直せます。
              </p>
              <div className="mt-3">
                <ReleaseRejoinEmailButton profileId={profile.id} />
              </div>
            </div>
          ) : null}
          {(profile as { email_before_rejoin_release?: string | null }).email_before_rejoin_release ? (
            <div className="mt-3 text-xs">
              <p className="text-muted-foreground">退避前のログイン用メール</p>
              <p className="mt-1 break-all font-mono">
                {(profile as { email_before_rejoin_release?: string }).email_before_rejoin_release}
              </p>
            </div>
          ) : null}
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
            {(profile.zip_code ||
              profile.address ||
              (profile as { address_prefecture?: string | null }).address_prefecture ||
              (profile as { address_city?: string | null }).address_city ||
              (profile as { address_street?: string | null }).address_street) && (
              <>
                {profile.zip_code ? (
                  <div>
                    <dt className="text-muted-foreground">郵便番号</dt>
                    <dd>{profile.zip_code}</dd>
                  </div>
                ) : null}
                {(profile as { address_prefecture?: string | null }).address_prefecture ? (
                  <div>
                    <dt className="text-muted-foreground">都道府県</dt>
                    <dd>{(profile as { address_prefecture?: string }).address_prefecture}</dd>
                  </div>
                ) : null}
                {(profile as { address_city?: string | null }).address_city ? (
                  <div>
                    <dt className="text-muted-foreground">市区町村</dt>
                    <dd>{(profile as { address_city?: string }).address_city}</dd>
                  </div>
                ) : null}
                {(profile as { address_street?: string | null }).address_street ? (
                  <div>
                    <dt className="text-muted-foreground">番地</dt>
                    <dd>{(profile as { address_street?: string }).address_street}</dd>
                  </div>
                ) : null}
                {(profile as { address_building?: string | null }).address_building ? (
                  <div>
                    <dt className="text-muted-foreground">建物名</dt>
                    <dd>{(profile as { address_building?: string }).address_building}</dd>
                  </div>
                ) : null}
                {(joinAddressLine({
                  prefecture: (profile as { address_prefecture?: string | null }).address_prefecture,
                  city: (profile as { address_city?: string | null }).address_city,
                  street: (profile as { address_street?: string | null }).address_street,
                  building: (profile as { address_building?: string | null }).address_building,
                }) ||
                  profile.address) && (
                  <div>
                    <dt className="text-muted-foreground">住所（連結）</dt>
                    <dd>
                      {joinAddressLine({
                        prefecture: (profile as { address_prefecture?: string | null }).address_prefecture,
                        city: (profile as { address_city?: string | null }).address_city,
                        street: (profile as { address_street?: string | null }).address_street,
                        building: (profile as { address_building?: string | null }).address_building,
                      }) || profile.address}
                    </dd>
                  </div>
                )}
              </>
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

      <div className="flex flex-wrap items-center gap-4">
        {(profile.status === "expired" || profile.status === "expelled") && (
          <MemberReviveButton
            profileId={profile.id}
            memberName={profile.name ?? "会員"}
            defaultExpiryDate={suggestReviveExpiry(latestMembership?.expiry_date)}
          />
        )}
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
