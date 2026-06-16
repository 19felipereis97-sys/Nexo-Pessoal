-- Module 7: daily execution center

alter table public.tasks add column if not exists execution_order integer;

create table if not exists public.daily_notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_date date not null default current_date,
  content text not null,
  converted_task_id uuid references public.tasks(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  review_date date not null default current_date,
  summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, review_date)
);

create table if not exists public.focus_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists daily_notes_user_date_idx on public.daily_notes(user_id, note_date);
create index if not exists focus_sessions_user_started_idx on public.focus_sessions(user_id, started_at);

alter table public.daily_notes enable row level security;
alter table public.daily_reviews enable row level security;
alter table public.focus_sessions enable row level security;

create policy "daily_notes: own all" on public.daily_notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "daily_reviews: own all" on public.daily_reviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "focus_sessions: own all" on public.focus_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace trigger daily_reviews_updated_at before update on public.daily_reviews
  for each row execute function public.handle_updated_at();
