-- Módulo 13: IA com Gemini
-- Tabela de interações com o assistente IA

create table if not exists public.ai_interactions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  mode         text not null default 'chat',
  question     text not null,
  answer       text not null,
  context      jsonb,
  feedback     text check (feedback in ('helpful', 'not_helpful')),
  created_at   timestamptz not null default now()
);

create index if not exists ai_interactions_user_created_idx
  on public.ai_interactions(user_id, created_at desc);

alter table public.ai_interactions enable row level security;

create policy "ai_interactions: select own"
  on public.ai_interactions for select
  using (auth.uid() = user_id);

create policy "ai_interactions: insert own"
  on public.ai_interactions for insert
  with check (auth.uid() = user_id);

create policy "ai_interactions: update own"
  on public.ai_interactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "ai_interactions: delete own"
  on public.ai_interactions for delete
  using (auth.uid() = user_id);
