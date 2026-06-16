-- Module 6: meetings

alter table public.meetings drop constraint if exists meetings_status_check;
update public.meetings set status = 'reagendada' where status = 'adiada';
alter table public.meetings add constraint meetings_status_check
  check (status in ('agendada', 'realizada', 'cancelada', 'reagendada'));

alter table public.meetings add column if not exists participants text[] not null default '{}';
alter table public.meetings add column if not exists next_steps text;
alter table public.tasks add column if not exists meeting_id uuid references public.meetings(id) on delete set null;
alter table public.project_decisions add column if not exists meeting_id uuid references public.meetings(id) on delete set null;

create index if not exists tasks_meeting_id_idx on public.tasks(meeting_id);
create index if not exists project_decisions_meeting_id_idx on public.project_decisions(meeting_id);
create unique index if not exists calendar_events_meeting_unique_idx
  on public.calendar_events(meeting_id) where meeting_id is not null;

