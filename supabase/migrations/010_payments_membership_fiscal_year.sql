-- 会費を「〇〇年度」と紐づける（支払履歴・未納抽出用）
ALTER TABLE payments ADD COLUMN IF NOT EXISTS membership_fiscal_year INTEGER;

COMMENT ON COLUMN payments.membership_fiscal_year IS '会費の対象年度（4月始まりの年度の開始年。例: 2025 = 2025年度 = 2025-04-01〜2026-03-31）';

CREATE INDEX IF NOT EXISTS idx_payments_membership_fee_fiscal
  ON payments (profile_id, membership_fiscal_year)
  WHERE purpose = 'membership_fee';
