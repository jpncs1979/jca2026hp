-- profiles の管理者用 RLS が「profiles を再度 SELECT」しており、
-- PostgreSQL が infinite recursion を検出する。SECURITY DEFINER で
-- RLS をオフにしたヘルパーに置き換える。

CREATE OR REPLACE FUNCTION public.current_user_is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = (SELECT auth.uid())
      AND p.is_admin = true
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_is_app_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_is_app_admin() TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.current_user_is_app_admin() IS 'RLS 用: auth.uid() が is_admin の profile を持つか。profiles ポリシー再帰を避けるため SECURITY DEFINER + row_security off。';

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (public.current_user_is_app_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.current_user_is_app_admin());

DROP POLICY IF EXISTS "Admins can manage memberships" ON public.memberships;
CREATE POLICY "Admins can manage memberships" ON public.memberships
  FOR ALL
  USING (public.current_user_is_app_admin())
  WITH CHECK (public.current_user_is_app_admin());

DROP POLICY IF EXISTS "Admins can read all applications" ON public.applications;
CREATE POLICY "Admins can read all applications" ON public.applications
  FOR SELECT USING (public.current_user_is_app_admin());

DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
CREATE POLICY "Admins can manage payments" ON public.payments
  FOR ALL
  USING (public.current_user_is_app_admin())
  WITH CHECK (public.current_user_is_app_admin());

DROP POLICY IF EXISTS "Admins can manage member_contents" ON public.member_contents;
CREATE POLICY "Admins can manage member_contents" ON public.member_contents
  FOR ALL
  USING (public.current_user_is_app_admin())
  WITH CHECK (public.current_user_is_app_admin());
