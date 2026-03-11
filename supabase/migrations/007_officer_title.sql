-- 役員を boolean から「役員職名」（理事・監事など自由入力）に変更
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS officer_title TEXT;

-- 既存の is_officer = true を「理事」として移行（006未適用の場合はスキップ）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_officer') THEN
    UPDATE profiles SET officer_title = '理事' WHERE is_officer = true AND (officer_title IS NULL OR officer_title = '');
  END IF;
END $$;

DROP INDEX IF EXISTS idx_profiles_is_officer;
ALTER TABLE profiles DROP COLUMN IF EXISTS is_officer;

CREATE INDEX IF NOT EXISTS idx_profiles_officer_title ON profiles(officer_title) WHERE officer_title IS NOT NULL AND officer_title != '';
