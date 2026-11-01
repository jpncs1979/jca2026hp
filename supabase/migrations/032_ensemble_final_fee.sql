-- 第19回アンコン（2026-11-01）
-- 1) 代表者生年月日は会員申込のときだけ必須にしたので、applications.birth_date を空でも保存できるようにする
-- 2) 本選参加料（予選通過団体のみ・演奏者1人ごと）のカード支払いを記録する列を追加する

ALTER TABLE applications ALTER COLUMN birth_date DROP NOT NULL;

ALTER TABLE applications ADD COLUMN IF NOT EXISTS final_fee_status TEXT
  CHECK (final_fee_status IS NULL OR final_fee_status IN ('paid', 'free'));
ALTER TABLE applications ADD COLUMN IF NOT EXISTS final_fee_amount INTEGER;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS final_performer_count INTEGER;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS final_fee_paid_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS final_fee_payment_intent TEXT;

COMMENT ON COLUMN applications.final_fee_status IS '本選参加料: NULL=未払い, paid=カード決済済み, free=0円（会員の小中・高校生部門）で参加確定';
