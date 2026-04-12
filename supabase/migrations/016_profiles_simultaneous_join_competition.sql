-- コンクール申込フォームからの「同時入会」で作成された会員を識別する（competitions.slug 相当）
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS simultaneous_join_competition_slug TEXT NULL;

COMMENT ON COLUMN profiles.simultaneous_join_competition_slug IS 'コンクール申込で同時入会した場合の大会スラッグ（例: young-2026）';
