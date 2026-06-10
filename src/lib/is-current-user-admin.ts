import { createAdminClient, createClient } from "@/lib/supabase/server";

/** ログイン中のユーザーが事務局管理者（profiles.is_admin）か */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    return profile?.is_admin === true;
  } catch {
    return false;
  }
}
