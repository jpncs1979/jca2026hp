import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import { AdminMemberEditForm } from "./form";

const SELECT_COLS = `
  id, member_number, name, name_kana, email, zip_code, address, phone,
  affiliation, status, membership_type, is_ica_member, is_css_user, officer_title,
  gender, birth_date, notes, created_at,
  memberships(join_date, expiry_date, payment_method)
`;

export default async function AdminMemberEditPage({
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

  let { data: profile, error } = await admin
    .from("profiles")
    .select(SELECT_COLS)
    .eq("id", id)
    .single();

  if (error?.message?.includes("is_ica_member") || error?.message?.includes("is_css_user") || error?.message?.includes("column")) {
    const retry = await admin.from("profiles").select(SELECT_COLS).eq("id", id).single();
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

  const profileAny = profile as { is_ica_member?: boolean; is_css_user?: boolean; officer_title?: string | null; gender?: string; birth_date?: string; notes?: string };
  return (
    <div className="space-y-6">
      <Link
        href={`/admin/members/${id}`}
        className="inline-flex gap-2 text-sm text-muted-foreground hover:text-navy"
      >
        <ArrowLeft className="size-4" />
        会員詳細に戻る
      </Link>
      <h1 className="text-2xl font-bold text-navy">会員情報の編集</h1>
      <AdminMemberEditForm
        profileId={profile.id}
        initial={{
          name: profile.name ?? "",
          name_kana: profile.name_kana ?? "",
          email: profile.email ?? "",
          zip_code: profile.zip_code ?? "",
          address: profile.address ?? "",
          phone: profile.phone ?? "",
          affiliation: profile.affiliation ?? "",
          status: profile.status ?? "pending",
          membership_type: profile.membership_type ?? "regular",
          is_ica_member: profileAny.is_ica_member ?? false,
          is_css_user: profileAny.is_css_user ?? true,
          officer_title: profileAny.officer_title ?? "",
          gender: profileAny.gender ?? "",
          birth_date: profileAny.birth_date ?? "",
          notes: profileAny.notes ?? "",
          expiry_date: latestMembership?.expiry_date ?? "",
          payment_method: latestMembership?.payment_method ?? "transfer",
        }}
      />
    </div>
  );
}
