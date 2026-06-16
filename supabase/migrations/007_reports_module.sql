-- Module 11: Reports & Weekly Review

create table if not exists public.weekly_reviews (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  week_start    date not null,
  week_end      date not null,
  summary       text,
  wins          text,
  pending_items text,
  next_focus    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.weekly_reviews enable row level security;

create policy "weekly_reviews: select own"
  on public.weekly_reviews for select
  using (auth.uid() = user_id);

create policy "weekly_reviews: insert own"
  on public.weekly_reviews for insert
  with check (auth.uid() = user_id);

create policy "weekly_reviews: update own"
  on public.weekly_reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "weekly_reviews: delete own"
  on public.weekly_reviews for delete
  using (auth.uid() = user_id);

create unique index if not exists weekly_reviews_user_week_idx
  on public.weekly_reviews(user_id, week_start);

create index if not exists weekly_reviews_user_id_idx
  on public.weekly_reviews(user_id);

create or replace trigger weekly_reviews_updated_at
  before update on public.weekly_reviews
  for each row execute function public.handle_updated_at();
