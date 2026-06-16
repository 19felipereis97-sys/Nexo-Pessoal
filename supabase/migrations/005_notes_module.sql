-- Module 8: notes

alter table public.notes drop constraint if exists notes_type_check;

update public.notes set type = 'nota_rapida' where type in ('nota', 'documento');
update public.notes set type = 'ideia' where type = 'ideia';
update public.notes set type = 'referencia' where type in ('referência', 'referÃªncia');
update public.notes set type = 'registro_reuniao' where type = 'ata';

alter table public.notes add column if not exists task_id uuid references public.tasks(id) on delete set null;
alter table public.notes add column if not exists meeting_id uuid references public.meetings(id) on delete set null;
alter table public.notes add column if not exists pinned boolean not null default false;
alter table public.notes add column if not exists archived boolean not null default false;
alter table public.notes add column if not exists converted_task_id uuid references public.tasks(id) on delete set null;
alter table public.notes add column if not exists converted_decision_id uuid references public.project_decisions(id) on delete set null;

alter table public.notes add constraint notes_type_check
  check (type in ('nota_rapida', 'ideia', 'decisao', 'procedimento', 'registro_reuniao', 'referencia', 'aprendizado'));

create index if not exists notes_project_id_idx on public.notes(project_id);
create index if not exists notes_task_id_idx on public.notes(task_id);
create index if not exists notes_meeting_id_idx on public.notes(meeting_id);
create index if not exists notes_archived_idx on public.notes(user_id, archived);

create or replace function public.enforce_note_links()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  linked_project uuid;
begin
  if new.task_id is not null then
    select project_id into linked_project from public.tasks where id = new.task_id and user_id = new.user_id;
    if not found then raise exception 'Tarefa vinculada não pertence ao usuário'; end if;
    if new.project_id is null and linked_project is not null then new.project_id = linked_project; end if;
  end if;
  if new.meeting_id is not null then
    select project_id into linked_project from public.meetings where id = new.meeting_id and user_id = new.user_id;
    if not found then raise exception 'Reunião vinculada não pertence ao usuário'; end if;
    if new.project_id is null and linked_project is not null then new.project_id = linked_project; end if;
  end if;
  return new;
end;
$$;

create or replace trigger notes_link_owner before insert or update of task_id, meeting_id, project_id on public.notes
  for each row execute function public.enforce_note_links();
