-- Module 15: Settings
-- Extends profiles + creates user_settings, notification_settings, security_settings, integration_settings

-- ── Extend profiles ───────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role      text,
  ADD COLUMN IF NOT EXISTS timezone  text DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS locale    text DEFAULT 'pt-BR';

-- Ensure RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND schemaname='public' AND policyname='profiles: select own') THEN
    CREATE POLICY "profiles: select own" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND schemaname='public' AND policyname='profiles: insert own') THEN
    CREATE POLICY "profiles: insert own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND schemaname='public' AND policyname='profiles: update own') THEN
    CREATE POLICY "profiles: update own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- ── user_settings ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_settings (
  id                          uuid primary key default uuid_generate_v4(),
  user_id                     uuid not null unique references auth.users(id) on delete cascade,
  -- Appearance
  theme                       text not null default 'dark',
  accent_color                text not null default 'gold',
  dashboard_density           text not null default 'comfortable',
  enable_tooltips             boolean not null default true,
  enable_animations           boolean not null default true,
  enable_quick_create         boolean not null default true,
  -- System preferences
  date_format                 text not null default 'dd/MM/yyyy',
  time_format                 text not null default '24h',
  week_starts_on              text not null default 'monday',
  default_home_page           text not null default 'dashboard',
  -- Calendar preferences
  default_calendar_view       text not null default 'week',
  calendar_start_hour         integer not null default 8,
  calendar_end_hour           integer not null default 22,
  calendar_default_duration   integer not null default 60,
  calendar_show_weekends      boolean not null default true,
  -- Task & project preferences
  default_task_view           text not null default 'kanban',
  task_default_priority       text not null default 'media',
  task_show_completed         boolean not null default false,
  project_stale_days          integer not null default 14,
  -- Documents preferences
  doc_default_category        text,
  doc_show_archived           boolean not null default false,
  -- Assistant preferences
  assistant_enabled           boolean not null default true,
  assistant_daily_summary     boolean not null default true,
  assistant_weekly_review     boolean not null default true,
  assistant_tone              text not null default 'objetivo',
  assistant_suggest_reschedule boolean not null default true,
  assistant_generate_tasks    boolean not null default true,
  assistant_require_confirm   boolean not null default true,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON public.user_settings(user_id);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_settings: select own" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_settings: insert own" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_settings: update own" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE OR REPLACE TRIGGER user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── notification_settings ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null unique references auth.users(id) on delete cascade,
  notify_task_due         boolean not null default true,
  notify_task_overdue     boolean not null default true,
  notify_meeting_reminder boolean not null default true,
  notify_project_stalled  boolean not null default true,
  notify_routine_pending  boolean not null default true,
  notify_daily_summary    boolean not null default true,
  notify_weekly_review    boolean not null default true,
  daily_summary_time      time default '08:00',
  weekly_review_day       text default 'friday',
  weekly_review_time      time default '17:00',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS notification_settings_user_id_idx ON public.notification_settings(user_id);
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_settings: select own" ON public.notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notification_settings: insert own" ON public.notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notification_settings: update own" ON public.notification_settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE OR REPLACE TRIGGER notification_settings_updated_at BEFORE UPDATE ON public.notification_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── security_settings ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.security_settings (
  id                       uuid primary key default uuid_generate_v4(),
  user_id                  uuid not null unique references auth.users(id) on delete cascade,
  two_factor_enabled       boolean not null default false,
  session_timeout_minutes  integer not null default 120,
  login_alerts_enabled     boolean not null default true,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS security_settings_user_id_idx ON public.security_settings(user_id);
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "security_settings: select own" ON public.security_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "security_settings: insert own" ON public.security_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "security_settings: update own" ON public.security_settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE OR REPLACE TRIGGER security_settings_updated_at BEFORE UPDATE ON public.security_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── integration_settings ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.integration_settings (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  provider     text not null,
  status       text not null default 'disconnected',
  metadata     jsonb,
  connected_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  UNIQUE(user_id, provider)
);
CREATE INDEX IF NOT EXISTS integration_settings_user_idx ON public.integration_settings(user_id);
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integration_settings: select own" ON public.integration_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "integration_settings: insert own" ON public.integration_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "integration_settings: update own" ON public.integration_settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "integration_settings: delete own" ON public.integration_settings FOR DELETE USING (auth.uid() = user_id);
CREATE OR REPLACE TRIGGER integration_settings_updated_at BEFORE UPDATE ON public.integration_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
