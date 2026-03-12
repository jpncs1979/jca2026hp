-- クラリネット相談室 質問テーブル
create table if not exists consultation_questions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  nickname text,
  age text,
  category text not null,
  body text,
  status text not null default 'pending' check (status in ('pending', 'answered', 'published')),
  answer text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_consultation_questions_status on consultation_questions(status);
create index if not exists idx_consultation_questions_published_at on consultation_questions(published_at desc nulls last);

-- RLS: 誰でも新規投稿可能、公開済みのみ閲覧可能
alter table consultation_questions enable row level security;

create policy "誰でも新規投稿可能"
  on consultation_questions for insert
  with check (true);

create policy "公開済みのみ閲覧可能"
  on consultation_questions for select
  using (status = 'published');
