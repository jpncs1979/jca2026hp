-- 相談室: 本人の承諾を得てからHPに掲載する
--
-- 公開ページは consultation_public_qa だけを読む。
-- consultation_questions 自体は anon / authenticated から select できない
-- （公開済み行の本名・メールアドレスが漏れないようにする）。
-- ビューは security_invoker = false（所有者の権限）にする。
-- true にすると元テーブルの RLS が効き、select ポリシーを外した公開列も出せなくなる。

alter table public.consultation_questions
  add column if not exists publish_wanted boolean not null default false,
  add column if not exists public_name text,
  add column if not exists public_question text,
  add column if not exists consent_token_hash text,
  add column if not exists consent_requested_at timestamptz,
  add column if not exists consent_expires_at timestamptz,
  add column if not exists consent_status text not null default 'not_requested',
  add column if not exists consented_at timestamptz,
  add column if not exists answer_sent_at timestamptz;

update public.consultation_questions
set
  public_name = coalesce(public_name, nickname),
  public_question = coalesce(public_question, body);

-- 以前の運用で公開済みの行は、承諾済みとして掲載を残す
update public.consultation_questions
set
  publish_wanted = true,
  consent_status = 'approved',
  consented_at = coalesce(consented_at, published_at, created_at)
where status = 'published'
  and consent_status = 'not_requested';

do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'consultation_questions'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%status%'
      and pg_get_constraintdef(con.oid) not ilike '%consent_status%'
  loop
    execute format(
      'alter table public.consultation_questions drop constraint %I',
      r.conname
    );
  end loop;
end $$;

alter table public.consultation_questions
  add constraint consultation_questions_status_check
  check (status in (
    'pending',
    'answered',
    'sent',
    'awaiting_consent',
    'published',
    'declined',
    'unpublished'
  ));

alter table public.consultation_questions
  drop constraint if exists consultation_questions_consent_status_check;

alter table public.consultation_questions
  add constraint consultation_questions_consent_status_check
  check (consent_status in ('not_requested', 'requested', 'approved', 'declined'));

create unique index if not exists consultation_questions_consent_token_hash_idx
  on public.consultation_questions (consent_token_hash)
  where consent_token_hash is not null;

drop policy if exists "公開済みのみ閲覧可能" on public.consultation_questions;
drop policy if exists "誰でも新規投稿可能" on public.consultation_questions;
drop policy if exists "相談は未回答としてのみ受け付ける" on public.consultation_questions;

-- 受付APIは service_role で入れる。anon キーで公開済み行や承諾済みを捏造できないようにする。
create policy "相談は未回答としてのみ受け付ける"
  on public.consultation_questions
  for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and consent_status = 'not_requested'
    and published_at is null
    and answer is null
    and consent_token_hash is null
    and consented_at is null
  );

create or replace view public.consultation_public_qa
with (security_barrier = true, security_invoker = false) as
select
  id,
  category,
  public_name,
  age,
  public_question,
  answer,
  published_at
from public.consultation_questions
where status = 'published'
  and published_at is not null;

comment on view public.consultation_public_qa is
  '相談室のHP公開用。掲載中の行について、ハンドルネーム・質問文・回答など公開してよい列だけを出す。';

revoke all on table public.consultation_public_qa from public;
revoke all on table public.consultation_public_qa from anon, authenticated;
grant select on table public.consultation_public_qa to anon, authenticated, service_role;

notify pgrst, 'reload schema';
