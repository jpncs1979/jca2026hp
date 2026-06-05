-- ============================================
-- 会員データ簡素化（設計書 docs/会員データ簡素化_設計書.md）
-- - 決済経路: card | other + note（CSS は note = 'CSS'）
-- - 会員資格末日の denormalize: membership_valid_until
-- - 手動退会メモ: expulsion_note
-- is_css_user は非推奨（削除は別マイグレーション）
-- ============================================

-- --------------------------------------------
-- 1. payment_channel / payment_channel_note
-- --------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS payment_channel TEXT;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS payment_channel_note TEXT;

COMMENT ON COLUMN profiles.payment_channel IS
  '会費継続の支払い経路: card=Stripeカード, other=カード以外（CSS等は payment_channel_note）';

COMMENT ON COLUMN profiles.payment_channel_note IS
  'other 時の経路メモ。CSS口座振替は ''CSS'' 固定推奨';

-- 既存行を埋めてから NOT NULL + CHECK
UPDATE profiles
SET
  payment_channel = CASE
    WHEN COALESCE(is_css_user, true) = false THEN 'card'
    WHEN import_payment_kind IN ('legacy_credit') THEN 'card'
    WHEN import_payment_kind IN ('css', 'web_transfer') THEN 'other'
    WHEN stripe_customer_id IS NOT NULL AND COALESCE(is_css_user, true) = false THEN 'card'
    ELSE 'other'
  END,
  payment_channel_note = CASE
    WHEN COALESCE(is_css_user, true) = true THEN 'CSS'
    WHEN import_payment_kind = 'css' THEN 'CSS'
    WHEN import_payment_kind = 'web_transfer' THEN 'CSS'
    WHEN import_payment_kind = 'other' THEN 'その他'
    ELSE NULL
  END
WHERE payment_channel IS NULL;

-- card のときメモは空に揃える
UPDATE profiles
SET payment_channel_note = NULL
WHERE payment_channel = 'card';

-- デフォルト（新規は CSS 想定の旧仕様に合わせ other+CSS ではなく、入会Webhookが card を入れる）
ALTER TABLE profiles
  ALTER COLUMN payment_channel SET DEFAULT 'other';

UPDATE profiles SET payment_channel = 'other' WHERE payment_channel IS NULL;

ALTER TABLE profiles
  ALTER COLUMN payment_channel SET NOT NULL;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_payment_channel_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_payment_channel_check
  CHECK (payment_channel IN ('card', 'other'));

CREATE INDEX IF NOT EXISTS idx_profiles_payment_channel
  ON profiles (payment_channel);

CREATE INDEX IF NOT EXISTS idx_profiles_payment_channel_css
  ON profiles (payment_channel, payment_channel_note)
  WHERE payment_channel = 'other' AND payment_channel_note = 'CSS';

-- --------------------------------------------
-- 2. membership_valid_until（会員資格末日・4月基準）
-- --------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS membership_valid_until DATE;

COMMENT ON COLUMN profiles.membership_valid_until IS
  '会員資格の末日（会員年度末・多くは3/31）。一覧・照合の主参照。memberships 最新 expiry と同期';

-- 最新 memberships 行からバックフィル
UPDATE profiles p
SET membership_valid_until = sub.expiry_date
FROM (
  SELECT DISTINCT ON (m.profile_id)
    m.profile_id,
    m.expiry_date
  FROM memberships m
  ORDER BY m.profile_id, m.expiry_date DESC, m.updated_at DESC NULLS LAST
) sub
WHERE p.id = sub.profile_id
  AND p.membership_valid_until IS NULL;

-- --------------------------------------------
-- 3. 手動強制退会メモ
-- --------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS expulsion_note TEXT;

COMMENT ON COLUMN profiles.expulsion_note IS
  '事務局が手動で強制退会するときの自由記述メモ（expulsion_reason と併用）';

COMMENT ON COLUMN profiles.expulsion_reason IS
  '例: three_year_arrears | manual | other（自動バッチ廃止後は手動設定が主）';

-- --------------------------------------------
-- 4. memberships 更新時に profiles.membership_valid_until を同期（任意・推奨）
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_profile_membership_valid_until()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET
    membership_valid_until = NEW.expiry_date,
    updated_at = now()
  WHERE id = NEW.profile_id
    AND (
      membership_valid_until IS NULL
      OR membership_valid_until < NEW.expiry_date
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_membership_valid_until ON memberships;

CREATE TRIGGER trg_sync_profile_membership_valid_until
  AFTER INSERT OR UPDATE OF expiry_date ON memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_membership_valid_until();

COMMENT ON FUNCTION public.sync_profile_membership_valid_until() IS
  'memberships.expiry_date 更新時、profiles.membership_valid_until を延長方向のみ同期';

-- --------------------------------------------
-- 5. 退会候補ビュー（参照用・RLS は profiles 経由で管理者APIから利用）
-- --------------------------------------------
CREATE OR REPLACE VIEW public.admin_members_expulsion_watch AS
SELECT
  p.id AS profile_id,
  p.member_number,
  p.name,
  p.email,
  p.status,
  p.payment_channel,
  p.payment_channel_note,
  p.membership_valid_until,
  m.join_date,
  m.expiry_date AS latest_membership_expiry
FROM profiles p
LEFT JOIN LATERAL (
  SELECT join_date, expiry_date
  FROM memberships m2
  WHERE m2.profile_id = p.id
  ORDER BY m2.expiry_date DESC, m2.updated_at DESC NULLS LAST
  LIMIT 1
) m ON true
WHERE p.status = 'active';

COMMENT ON VIEW public.admin_members_expulsion_watch IS
  '3年未納退会候補の事前確認用（最終判定はアプリの shouldExpel... + payments）。手動退会運用';

-- ビューは RLS 対象外のため、参照は service role / 管理者 API のみとすること
