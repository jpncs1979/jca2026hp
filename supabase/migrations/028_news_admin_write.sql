-- 事務局（is_admin）が news を投稿・編集・削除できるようにする。
-- 一般公開の SELECT ポリシー（publish_date <= 今日）はそのまま維持し、
-- 管理者は未公開（未来日）の記事も含めて閲覧・編集できるようにする。

DROP POLICY IF EXISTS "Admins can read all news" ON public.news;
CREATE POLICY "Admins can read all news" ON public.news
  FOR SELECT USING (public.current_user_is_app_admin());

DROP POLICY IF EXISTS "Admins can manage news" ON public.news;
CREATE POLICY "Admins can manage news" ON public.news
  FOR INSERT WITH CHECK (public.current_user_is_app_admin());

DROP POLICY IF EXISTS "Admins can update news" ON public.news;
CREATE POLICY "Admins can update news" ON public.news
  FOR UPDATE USING (public.current_user_is_app_admin())
  WITH CHECK (public.current_user_is_app_admin());

DROP POLICY IF EXISTS "Admins can delete news" ON public.news;
CREATE POLICY "Admins can delete news" ON public.news
  FOR DELETE USING (public.current_user_is_app_admin());
