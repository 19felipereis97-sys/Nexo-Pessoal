-- Module 5: projects

alter table public.projects drop constraint if exists projects_status_check;
alter table public.projects drop constraint if exists projects_priority_check;
alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks drop constraint if exists tasks_priority_check;
alter table public.calendar_events drop constraint if exists calendar_events_type_check;

update public.projects set status = 'concluido' where status in ('concluído', 'concluÃ­do');
update public.projects set status = 'arquivado' where status = 'cancelado';
update public.projects set status = 'em-andamento' where status = 'em andamento';
update public.projects set priority = 'critica' where priority in ('urgente', 'crítica', 'crÃ­tica');
update public.tasks set status = 'concluida' where status in ('concluído', 'concluÃ­do');
update public.tasks set status = 'em-andamento' where status = 'em andamento';
update public.tasks set status = 'a-fazer' where status in ('revisão', 'revisÃ£o');
update public.tasks set priority = 'critica' where priority in ('urgente', 'crítica', 'crÃ­tica');
update public.calendar_events set type = 'compromisso' where type in ('evento', 'lembrete', 'externo');
update public.calendar_events set type = 'prazo' where type = 'tarefa';
update public.calendar_events set type = 'foco' where type = 'bloqueio';
update public.calendar_events set type = 'reunião' where type = 'reuniÃ£o';

alter table public.projects add constraint projects_status_check
  check (status in ('planejado', 'em-andamento', 'aguardando', 'pausado', 'concluido', 'arquivado'));
alter table public.projects add constraint projects_priority_check
  check (priority in ('baixa', 'média', 'alta', 'critica'));
alter table public.tasks add constraint tasks_status_check
  check (status in ('backlog', 'a-fazer', 'em-andamento', 'aguardando', 'concluida', 'cancelado'));
alter table public.tasks add constraint tasks_priority_check
  check (priority in ('baixa', 'média', 'alta', 'critica'));
alter table public.calendar_events add constraint calendar_events_type_check
  check (type in ('compromisso', 'reunião', 'prazo', 'foco', 'pessoal', 'trabalho', 'estudo'));

create table if not exists public.project_decisions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists project_decisions_project_idx on public.project_decisions(project_id);
alter table public.project_decisions enable row level security;
create policy "project_decisions: select own" on public.project_decisions for select using (auth.uid() = user_id);
create policy "project_decisions: insert own" on public.project_decisions for insert with check (auth.uid() = user_id);
create policy "project_decisions: update own" on public.project_decisions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "project_decisions: delete own" on public.project_decisions for delete using (auth.uid() = user_id);

create or replace function public.enforce_project_ownership()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.project_id is not null and not exists (
    select 1 from public.projects where id = new.project_id and user_id = new.user_id
  ) then
    raise exception 'Projeto vinculado não pertence ao usuário';
  end if;
  return new;
end;
$$;

create or replace trigger tasks_project_owner before insert or update of project_id on public.tasks
  for each row execute function public.enforce_project_ownership();
create or replace trigger events_project_owner before insert or update of project_id on public.calendar_events
  for each row execute function public.enforce_project_ownership();
create or replace trigger meetings_project_owner before insert or update of project_id on public.meetings
  for each row execute function public.enforce_project_ownership();
create or replace trigger notes_project_owner before insert or update of project_id on public.notes
  for each row execute function public.enforce_project_ownership();
create or replace trigger decisions_project_owner before insert or update of project_id on public.project_decisions
  for each row execute function public.enforce_project_ownership();

create or replace function public.refresh_project_progress(target_project_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare task_total integer; task_done integer;
begin
  if target_project_id is null then return; end if;
  select count(*), count(*) filter (where status = 'concluida')
    into task_total, task_done from public.tasks
    where project_id = target_project_id and status <> 'cancelado';
  update public.projects set progress =
    case when task_total = 0 then 0 else round((task_done::numeric / task_total) * 100) end
    where id = target_project_id;
end;
$$;

create or replace function public.handle_project_task_progress()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.refresh_project_progress(coalesce(new.project_id, old.project_id));
  if tg_op = 'UPDATE' and old.project_id is distinct from new.project_id then
    perform public.refresh_project_progress(old.project_id);
  end if;
  return coalesce(new, old);
end;
$$;

create or replace trigger tasks_project_progress
  after insert or update or delete on public.tasks
  for each row execute function public.handle_project_task_progress();
