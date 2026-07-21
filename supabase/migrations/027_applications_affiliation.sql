-- コンクール申込: 所属（出身校等）

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS affiliation text;

COMMENT ON COLUMN public.applications.affiliation IS '所属（出身校・勤務先等）';
