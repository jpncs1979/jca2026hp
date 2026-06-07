-- 強制退会（expelled）仕様の廃止
-- 3年滞納者の退会・削除は手動運用（会費状況CSVで確認 → 会員詳細から退会／手動削除）に一本化する。
-- 既存の expelled レコードは expired（退会済み）に統一し、status 制約から expelled を除外する。
--
-- 注意: expelled_at / expulsion_reason / email_before_rejoin_release 列は
--   破壊的変更を避けるため物理削除はしない（旧データ・監査用に残す。コードからは参照しない）。

-- 1) 既存の強制退会レコードを「期限切れ（退会済み）」に統一
UPDATE profiles
SET status = 'expired', updated_at = now()
WHERE status = 'expelled';

-- 2) status 制約から 'expelled' を除外
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_status_check
  CHECK (status IN ('pending', 'active', 'expired'));

-- 3) expelled 専用インデックスを削除
DROP INDEX IF EXISTS idx_profiles_status_expelled;
