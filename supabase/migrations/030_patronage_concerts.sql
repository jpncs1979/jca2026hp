-- 後援演奏会: 申請 → 事務局承認 → 案内ページ自動掲載

CREATE TABLE IF NOT EXISTS public.patronage_concerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,

  applicant_name text NOT NULL,
  applicant_email text NOT NULL,
  member_number text,

  concert_title text NOT NULL,
  event_date date NOT NULL,
  doors_open text NOT NULL,
  curtain_time text NOT NULL,
  venue text NOT NULL,
  admission text NOT NULL,
  performers text NOT NULL,
  program text NOT NULL,
  organizer text NOT NULL,
  contact text NOT NULL,
  consent_destination text NOT NULL,
  notes text,

  flyer_path text,
  flyer_content_type text,
  flyer_filename text,

  status text NOT NULL DEFAULT 'pending',
  approved_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT patronage_concerts_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'unpublished'))
);

CREATE INDEX IF NOT EXISTS patronage_concerts_status_event_date_idx
  ON public.patronage_concerts (status, event_date);

CREATE INDEX IF NOT EXISTS patronage_concerts_created_at_idx
  ON public.patronage_concerts (created_at DESC);

COMMENT ON TABLE public.patronage_concerts IS '後援依頼の申請。status=approved の公演を案内ページに掲載する';
COMMENT ON COLUMN public.patronage_concerts.flyer_path IS 'Storage bucket patronage-flyers 内のパス';
COMMENT ON COLUMN public.patronage_concerts.status IS 'pending: 未承認 / approved: 掲載中 / rejected: 却下 / unpublished: 掲載取り下げ';

ALTER TABLE public.patronage_concerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read approved patronage concerts" ON public.patronage_concerts;
CREATE POLICY "Anyone can read approved patronage concerts" ON public.patronage_concerts
  FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Admins can manage patronage concerts" ON public.patronage_concerts;
CREATE POLICY "Admins can manage patronage concerts" ON public.patronage_concerts
  FOR ALL
  USING (public.current_user_is_app_admin())
  WITH CHECK (public.current_user_is_app_admin());

GRANT SELECT ON public.patronage_concerts TO anon, authenticated;
GRANT ALL ON public.patronage_concerts TO service_role;

INSERT INTO storage.buckets (id, name, public)
VALUES ('patronage-flyers', 'patronage-flyers', false)
ON CONFLICT (id) DO NOTHING;
