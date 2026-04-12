-- Stripe Customer（1月自動引き落とし・マイページ再決済で再利用）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe Customer ID（年会費の1月自動引き落とし・Checkout 再利用）';

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

COMMENT ON COLUMN payments.membership_fiscal_year IS '会費の対象年度（事業年度の開始年。2/1〜翌1/31 を N 年度）';
