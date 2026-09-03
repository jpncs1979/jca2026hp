-- 会員専用サイト v1: 会報バックナンバー PDF アーカイブ
-- member_contents を会報アーカイブ用に拡張し、Storage バケットを作成、
-- RLS 読み取りポリシーを membership_valid_until ベースに直す。

-- ============================================
-- 1. member_contents 拡張
-- ============================================
ALTER TABLE public.member_contents
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'bulletin',
  ADD COLUMN IF NOT EXISTS issue_label text,
  ADD COLUMN IF NOT EXISTS issue_date date,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS external_url text,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

ALTER TABLE public.member_contents DROP CONSTRAINT IF EXISTS member_contents_category_check;
ALTER TABLE public.member_contents
  ADD CONSTRAINT member_contents_category_check
  CHECK (category IN ('bulletin', 'video', 'score', 'other'));

-- file_path を nullable 化し、ファイルか外部URLのどちらかは必須にする
ALTER TABLE public.member_contents ALTER COLUMN file_path DROP NOT NULL;
ALTER TABLE public.member_contents DROP CONSTRAINT IF EXISTS member_contents_source_present_check;
ALTER TABLE public.member_contents
  ADD CONSTRAINT member_contents_source_present_check
  CHECK (file_path IS NOT NULL OR external_url IS NOT NULL);

COMMENT ON COLUMN public.member_contents.category IS 'bulletin: 会報 / video: 限定動画 / score: 楽譜 / other';
COMMENT ON COLUMN public.member_contents.issue_label IS '会報の号数など（例: 第120号）';
COMMENT ON COLUMN public.member_contents.issue_date IS '発行年月';
COMMENT ON COLUMN public.member_contents.external_url IS 'YouTube 限定公開など外部URL（file_path の代わり）';
COMMENT ON COLUMN public.member_contents.is_published IS 'false の間は会員側に表示しない（下書き）';

-- ============================================
-- 2. Storage バケット（未作成環境向け。018/019 と同じ書式）
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('member-contents', 'member-contents', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. RLS 読み取りポリシー差し替え
--    旧ポリシーは memberships の行を要求するため、
--    membership_valid_until だけ持つ import 会員が弾かれていた。
-- ============================================
DROP POLICY IF EXISTS "Active members can read member_contents" ON public.member_contents;
DROP POLICY IF EXISTS "Valid members can read member_contents" ON public.member_contents;
CREATE POLICY "Valid members can read member_contents" ON public.member_contents
  FOR SELECT USING (
    is_published
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.status = 'active'
        AND p.membership_valid_until >= CURRENT_DATE
    )
  );

-- admin の "Admins can manage member_contents" (current_user_is_app_admin) は 017 のまま。

-- ============================================
-- 4. membership_valid_until バックフィル
--    023 のトリガーは extends-only のため、NULL のままの active 会員がいる。
-- ============================================
UPDATE public.profiles p
SET membership_valid_until = sub.exp
FROM (
  SELECT profile_id, MAX(expiry_date) AS exp
  FROM public.memberships
  GROUP BY profile_id
) sub
WHERE p.id = sub.profile_id
  AND p.status = 'active'
  AND p.membership_valid_until IS NULL
  AND sub.exp IS NOT NULL;
