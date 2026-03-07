-- applications テーブルにメールアドレスカラムを追加
ALTER TABLE applications ADD COLUMN IF NOT EXISTS email TEXT;
