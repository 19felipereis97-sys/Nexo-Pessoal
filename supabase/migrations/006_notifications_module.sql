-- Module 9: internal notifications

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  severity text not null check (severity in ('info', 'warning', 'danger', 'success')),
  entity_type text not null,
  entity_id uuid not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, type, entity_type, entity_id)
);

create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications(user_id, read_at) where read_at is null;

alter table public.notifications enable row level security;

create policy "notifications: select own" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications: insert own" on public.notifications for insert with check (auth.uid() = user_id);
create policy "notifications: update own" on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications: delete own" on public.notifications for delete using (auth.uid() = user_id);
