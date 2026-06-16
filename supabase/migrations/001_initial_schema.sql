-- ============================================================
-- Nexo Pessoal – Migração Inicial (Módulo 1)
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- Habilitar extensão UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABELA: profiles
-- ============================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  email         text,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- TABELA: projects
-- ============================================================
create table if not exists public.projects (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  description   text,
  status        text not null default 'planejado'
                  check (status in ('planejado', 'em andamento', 'pausado', 'concluído', 'cancelado')),
  priority      text not null default 'média'
                  check (priority in ('baixa', 'média', 'alta', 'urgente')),
  start_date    date,
  due_date      date,
  progress      numeric not null default 0 check (progress >= 0 and progress <= 100),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- TABELA: tasks
-- ============================================================
create table if not exists public.tasks (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  project_id    uuid references public.projects(id) on delete set null,
  title         text not null,
  description   text,
  status        text not null default 'backlog'
                  check (status in ('backlog', 'em andamento', 'revisão', 'concluído', 'cancelado')),
  priority      text not null default 'média'
                  check (priority in ('baixa', 'média', 'alta', 'urgente')),
  due_date      date,
  due_time      time,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- TABELA: meetings
-- ============================================================
create table if not exists public.meetings (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  project_id         uuid references public.projects(id) on delete set null,
  title              text not null,
  description        text,
  scheduled_at       timestamptz not null,
  duration_minutes   integer not null default 60,
  location           text,
  status             text not null default 'agendada'
                       check (status in ('agendada', 'realizada', 'cancelada', 'adiada')),
  agenda             text,
  minutes            text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ============================================================
-- TABELA: calendar_events
-- ============================================================
create table if not exists public.calendar_events (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  start_at    timestamptz not null,
  end_at      timestamptz not null,
  type        text not null default 'evento'
                check (type in ('evento', 'reunião', 'tarefa', 'lembrete', 'bloqueio', 'externo')),
  location    text,
  project_id  uuid references public.projects(id) on delete set null,
  meeting_id  uuid references public.meetings(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- TABELA: notes
-- ============================================================
create table if not exists public.notes (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  project_id  uuid references public.projects(id) on delete set null,
  title       text not null,
  content     text not null default '',
  type        text not null default 'nota'
                check (type in ('nota', 'ata', 'ideia', 'referência', 'documento')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- TABELA: tags
-- ============================================================
create table if not exists public.tags (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color       text not null default '#737373',
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);

-- ============================================================
-- TABELA: activity_logs
-- ============================================================
create table if not exists public.activity_logs (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  entity_type  text not null,
  entity_id    uuid not null,
  action       text not null,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- ÍNDICES DE PERFORMANCE
-- ============================================================
create index if not exists tasks_user_id_idx          on public.tasks(user_id);
create index if not exists tasks_project_id_idx       on public.tasks(project_id);
create index if not exists tasks_status_idx           on public.tasks(status);
create index if not exists tasks_due_date_idx         on public.tasks(due_date);
create index if not exists projects_user_id_idx       on public.projects(user_id);
create index if not exists calendar_events_user_idx   on public.calendar_events(user_id);
create index if not exists calendar_events_start_idx  on public.calendar_events(start_at);
create index if not exists meetings_user_id_idx       on public.meetings(user_id);
create index if not exists notes_user_id_idx          on public.notes(user_id);
create index if not exists tags_user_id_idx           on public.tags(user_id);
create index if not exists activity_logs_user_idx     on public.activity_logs(user_id);
create index if not exists activity_logs_entity_idx   on public.activity_logs(entity_type, entity_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles       enable row level security;
alter table public.tasks          enable row level security;
alter table public.projects       enable row level security;
alter table public.calendar_events enable row level security;
alter table public.meetings       enable row level security;
alter table public.notes          enable row level security;
alter table public.tags           enable row level security;
alter table public.activity_logs  enable row level security;

-- ============================================================
-- POLICIES: profiles
-- ============================================================
create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- POLICIES: tasks
-- ============================================================
create policy "tasks: select own"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "tasks: insert own"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "tasks: update own"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tasks: delete own"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- ============================================================
-- POLICIES: projects
-- ============================================================
create policy "projects: select own"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "projects: insert own"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "projects: update own"
  on public.projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "projects: delete own"
  on public.projects for delete
  using (auth.uid() = user_id);

-- ============================================================
-- POLICIES: calendar_events
-- ============================================================
create policy "calendar_events: select own"
  on public.calendar_events for select
  using (auth.uid() = user_id);

create policy "calendar_events: insert own"
  on public.calendar_events for insert
  with check (auth.uid() = user_id);

create policy "calendar_events: update own"
  on public.calendar_events for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "calendar_events: delete own"
  on public.calendar_events for delete
  using (auth.uid() = user_id);

-- ============================================================
-- POLICIES: meetings
-- ============================================================
create policy "meetings: select own"
  on public.meetings for select
  using (auth.uid() = user_id);

create policy "meetings: insert own"
  on public.meetings for insert
  with check (auth.uid() = user_id);

create policy "meetings: update own"
  on public.meetings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "meetings: delete own"
  on public.meetings for delete
  using (auth.uid() = user_id);

-- ============================================================
-- POLICIES: notes
-- ============================================================
create policy "notes: select own"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "notes: insert own"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "notes: update own"
  on public.notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notes: delete own"
  on public.notes for delete
  using (auth.uid() = user_id);

-- ============================================================
-- POLICIES: tags
-- ============================================================
create policy "tags: select own"
  on public.tags for select
  using (auth.uid() = user_id);

create policy "tags: insert own"
  on public.tags for insert
  with check (auth.uid() = user_id);

create policy "tags: update own"
  on public.tags for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tags: delete own"
  on public.tags for delete
  using (auth.uid() = user_id);

-- ============================================================
-- POLICIES: activity_logs
-- ============================================================
create policy "activity_logs: select own"
  on public.activity_logs for select
  using (auth.uid() = user_id);

create policy "activity_logs: insert own"
  on public.activity_logs for insert
  with check (auth.uid() = user_id);

-- logs não podem ser alterados ou deletados
-- (sem update/delete policy = operação bloqueada por RLS)

-- ============================================================
-- TRIGGER: atualizar updated_at automaticamente
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create or replace trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.handle_updated_at();

create or replace trigger projects_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();

create or replace trigger calendar_events_updated_at
  before update on public.calendar_events
  for each row execute function public.handle_updated_at();

create or replace trigger meetings_updated_at
  before update on public.meetings
  for each row execute function public.handle_updated_at();

create or replace trigger notes_updated_at
  before update on public.notes
  for each row execute function public.handle_updated_at();

-- ============================================================
-- TRIGGER: criar profile automaticamente ao registrar usuário
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
