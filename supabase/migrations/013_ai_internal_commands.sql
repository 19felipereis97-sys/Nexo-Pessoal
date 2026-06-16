-- Module 14: internal AI command engine

create table if not exists public.ai_commands (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null default 'assistant',
  raw_text text not null,
  intent text not null,
  status text not null default 'draft'
    check (status in ('draft', 'executed', 'failed', 'cancelled')),
  payload jsonb not null default '{}'::jsonb,
  result_entity_type text,
  result_entity_id uuid,
  error text,
  executed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ai_commands_user_created_idx
  on public.ai_commands(user_id, created_at desc);

create index if not exists ai_commands_status_idx
  on public.ai_commands(user_id, status, created_at desc);

alter table public.ai_commands enable row level security;

create policy "ai_commands: select own"
  on public.ai_commands for select
  using (auth.uid() = user_id);

create policy "ai_commands: insert own"
  on public.ai_commands for insert
  with check (auth.uid() = user_id);

create policy "ai_commands: update own"
  on public.ai_commands for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "ai_commands: delete own"
  on public.ai_commands for delete
  using (auth.uid() = user_id);
