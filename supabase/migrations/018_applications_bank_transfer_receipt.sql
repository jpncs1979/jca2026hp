-- コンクール申込: カード / 銀行振込の区別と、振込領収書画像の Storage パス

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS payment_route text;

UPDATE public.applications
SET payment_route = 'stripe_card'
WHERE payment_route IS NULL;

ALTER TABLE public.applications
  ALTER COLUMN payment_route SET DEFAULT 'stripe_card';

ALTER TABLE public.applications
  ALTER COLUMN payment_route SET NOT NULL;

ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_payment_route_check;
ALTER TABLE public.applications
  ADD CONSTRAINT applications_payment_route_check
  CHECK (payment_route IN ('stripe_card', 'bank_transfer'));

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS transfer_receipt_path text;

COMMENT ON COLUMN public.applications.payment_route IS 'stripe_card: Stripe Checkout / bank_transfer: 郵便・銀行振込';
COMMENT ON COLUMN public.applications.transfer_receipt_path IS 'Supabase Storage bucket competition_transfer_receipts 内のパス';

INSERT INTO storage.buckets (id, name, public)
VALUES ('competition_transfer_receipts', 'competition_transfer_receipts', false)
ON CONFLICT (id) DO NOTHING;
