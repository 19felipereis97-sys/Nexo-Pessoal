-- Module 14: Reports – report_reviews table
-- Stores comprehensive saved reports with full statistics snapshot

create table if not exists public.report_reviews (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  type               text not null check (type in ('daily', 'weekly', 'monthly', 'custom')),
  period_start       date not null,
  period_end         date not null,
  title              text not null,
  summary            text,
  completed_tasks    integer not null default 0,
  pending_tasks      integer not null default 0,
  overdue_tasks      integer not null default 0,
  completed_routines integer not null default 0,
  total_routines     integer not null default 0,
  meetings_count     integer not null default 0,
  notes_count        integer not null default 0,
  documents_count    integer not null default 0,
  active_projects    integer not null default 0,
  stalled_projects   integer not null default 0,
  wins               text,
  pending_items      text,
  next_focus         text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Index for user + type + period lookups
create index if not exists report_reviews_user_type_idx on public.report_reviews(user_id, type);
create index if not exists report_reviews_user_period_idx on public.report_reviews(user_id, period_start desc);

-- RLS
alter table public.report_reviews enable row level security;

create policy "report_reviews: select own" on public.report_reviews
  for select using (auth.uid() = user_id);

create policy "report_reviews: insert own" on public.report_reviews
  for insert with check (auth.uid() = user_id);

create policy "report_reviews: update own" on public.report_reviews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "report_reviews: delete own" on public.report_reviews
  for delete using (auth.uid() = user_id);

-- Trigger
create or replace trigger report_reviews_updated_at
  before update on public.report_reviews
  for each row execute function public.handle_updated_at();
