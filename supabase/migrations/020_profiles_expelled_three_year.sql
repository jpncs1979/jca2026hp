-- 3年未納による強制退会（status = expelled）と再入会時のメール退避用カラム

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_status_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_status_check
  CHECK (status IN ('pending', 'active', 'expired', 'expelled'));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expelled_at TIMESTAMPTZ;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expulsion_reason TEXT;

COMMENT ON COLUMN profiles.expelled_at IS '強制退会とした日時（例: 3年未納バッチ）';

COMMENT ON COLUMN profiles.expulsion_reason IS '例: three_year_arrears';

-- ウェブ再入会を許可する際、退避前のログイン用メールを保持（監査・問い合わせ対応）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_before_rejoin_release TEXT;

COMMENT ON COLUMN profiles.email_before_rejoin_release IS '事務局がメールを退避する操作を行った際の元メール（1回のみ記録）';

CREATE INDEX IF NOT EXISTS idx_profiles_status_expelled ON profiles (status) WHERE status = 'expelled';
