-- ============================================
-- 会員取り込み・ICA会員・会友対応
-- ============================================

-- profiles: is_ica_member, 会友(friend), 性別・生年月日・備考
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_ica_member BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'signup' CHECK (source IN ('signup', 'import'));

-- membership_type に 会友(friend) を追加（既存制約を削除して再作成）
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_membership_type_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_membership_type_check
  CHECK (membership_type IN ('regular', 'student', 'supporting', 'friend'));

CREATE INDEX IF NOT EXISTS idx_profiles_is_ica_member ON profiles(is_ica_member);
