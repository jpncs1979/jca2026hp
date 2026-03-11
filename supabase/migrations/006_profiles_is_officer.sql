-- 会員名簿に役員を含める。職名（理事・監事など）を事務局が自由入力。
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS officer_title TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_officer_title ON profiles(officer_title) WHERE officer_title IS NOT NULL AND officer_title != '';
