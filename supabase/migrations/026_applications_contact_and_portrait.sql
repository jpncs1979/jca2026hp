-- コンクール申込: 連絡先（郵便番号・住所・携帯電話）と顔写真

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS zip_code text;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS address text;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS address_prefecture text;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS address_city text;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS address_street text;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS address_building text;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS portrait_path text;

COMMENT ON COLUMN public.applications.zip_code IS '郵便番号';
COMMENT ON COLUMN public.applications.address IS '住所（連結表示用）';
COMMENT ON COLUMN public.applications.address_prefecture IS '住所：都道府県';
COMMENT ON COLUMN public.applications.address_city IS '住所：市区町村';
COMMENT ON COLUMN public.applications.address_street IS '住所：番地';
COMMENT ON COLUMN public.applications.address_building IS '住所：建物名・部屋番号等';
COMMENT ON COLUMN public.applications.phone IS '携帯電話番号';
COMMENT ON COLUMN public.applications.portrait_path IS 'Supabase Storage bucket competition_portraits 内の顔写真パス';

INSERT INTO storage.buckets (id, name, public)
VALUES ('competition_portraits', 'competition_portraits', false)
ON CONFLICT (id) DO NOTHING;
