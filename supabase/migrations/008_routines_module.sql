-- Module 12: Routines
-- Tables: routines, routine_checklist_items, routine_logs

create table if not exists public.routines (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  description   text,
  frequency     text not null default 'diaria'
                  check (frequency in ('diaria', 'semanal', 'mensal', 'personalizada')),
  days_of_week  text[],
  target_time   time,
  area          text check (area in ('trabalho', 'estudos', 'saude', 'financeiro', 'pessoal', 'conteudo', 'mudanca', 'organizacao', 'projetos')),
  project_id    uuid references public.projects(id) on delete set null,
  status        text not null default 'active' check (status in ('active', 'archived')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.routine_checklist_items (
  id          uuid primary key default uuid_generate_v4(),
  routine_id  uuid not null references public.routines(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.routine_logs (
  id              uuid primary key default uuid_generate_v4(),
  routine_id      uuid not null references public.routines(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  completed_at    timestamptz not null default now(),
  reference_date  date not null,
  notes           text,
  created_at      timestamptz not null default now()
);

-- indexes
create index if not exists routines_user_status_idx on public.routines(user_id, status);
create index if not exists routine_checklist_items_routine_idx on public.routine_checklist_items(routine_id);
create index if not exists routine_logs_routine_date_idx on public.routine_logs(routine_id, reference_date);
create index if not exists routine_logs_user_date_idx on public.routine_logs(user_id, reference_date);
create unique index if not exists routine_logs_unique_day_idx on public.routine_logs(routine_id, user_id, reference_date);

-- RLS
alter table public.routines enable row level security;
alter table public.routine_checklist_items enable row level security;
alter table public.routine_logs enable row level security;

-- Routines policies
create policy "routines: select own" on public.routines for select using (auth.uid() = user_id);
create policy "routines: insert own" on public.routines for insert with check (auth.uid() = user_id);
create policy "routines: update own" on public.routines for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "routines: delete own" on public.routines for delete using (auth.uid() = user_id);

-- routine_checklist_items policies
create policy "routine_checklist_items: select own" on public.routine_checklist_items for select using (auth.uid() = user_id);
create policy "routine_checklist_items: insert own" on public.routine_checklist_items for insert with check (auth.uid() = user_id);
create policy "routine_checklist_items: update own" on public.routine_checklist_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "routine_checklist_items: delete own" on public.routine_checklist_items for delete using (auth.uid() = user_id);

-- routine_logs policies
create policy "routine_logs: select own" on public.routine_logs for select using (auth.uid() = user_id);
create policy "routine_logs: insert own" on public.routine_logs for insert with check (auth.uid() = user_id);
create policy "routine_logs: delete own" on public.routine_logs for delete using (auth.uid() = user_id);

-- Trigger updated_at for routines
create or replace trigger routines_updated_at
  before update on public.routines
  for each row execute function public.handle_updated_at();
