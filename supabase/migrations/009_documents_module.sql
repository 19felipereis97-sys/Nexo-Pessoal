-- Module 13: Documents
-- Table: documents | Bucket: documents (private)

-- ── Supabase Storage bucket ───────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 'documents', false, 52428800,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv', 'text/plain',
    'image/png', 'image/jpeg', 'image/webp'
  ]
) ON CONFLICT (id) DO NOTHING;

-- ── Storage RLS policies (path = {user_id}/{doc_id}/{filename}) ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'documents: user can upload'
  ) THEN
    CREATE POLICY "documents: user can upload" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'documents: user can read own'
  ) THEN
    CREATE POLICY "documents: user can read own" ON storage.objects
      FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'documents: user can delete own'
  ) THEN
    CREATE POLICY "documents: user can delete own" ON storage.objects
      FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'documents: user can update own'
  ) THEN
    CREATE POLICY "documents: user can update own" ON storage.objects
      FOR UPDATE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- ── documents table ───────────────────────────────────────────────
create table if not exists public.documents (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  project_id   uuid references public.projects(id) on delete set null,
  task_id      uuid references public.tasks(id) on delete set null,
  meeting_id   uuid references public.meetings(id) on delete set null,
  note_id      uuid references public.notes(id) on delete set null,
  title        text not null,
  description  text,
  file_name    text not null,
  file_path    text not null,
  file_type    text,
  file_size    numeric,
  category     text,
  tags         text[],
  status       text not null default 'active' check (status in ('active', 'archived')),
  uploaded_at  timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────────
create index if not exists documents_user_status_idx   on public.documents(user_id, status);
create index if not exists documents_user_category_idx on public.documents(user_id, category);
create index if not exists documents_user_uploaded_idx on public.documents(user_id, uploaded_at desc);

-- ── RLS ───────────────────────────────────────────────────────────
alter table public.documents enable row level security;

create policy "documents: select own" on public.documents for select using (auth.uid() = user_id);
create policy "documents: insert own" on public.documents for insert with check (auth.uid() = user_id);
create policy "documents: update own" on public.documents for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "documents: delete own" on public.documents for delete using (auth.uid() = user_id);

-- ── Trigger ───────────────────────────────────────────────────────
create or replace trigger documents_updated_at
  before update on public.documents
  for each row execute function public.handle_updated_at();
