import type { IntegrationSetting, NotificationSettings, Profile, SecuritySettings, UserSettings } from '@/lib/supabase/types'

export interface SettingsData {
  profile: Profile | null
  userSettings: UserSettings | null
  notificationSettings: NotificationSettings | null
  securitySettings: SecuritySettings | null
  integrations: IntegrationSetting[]
  authEmail: string | null
  authCreatedAt: string | null
  error: string | null
}

export const USER_SETTINGS_DEFAULTS: Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  theme: 'dark',
  accent_color: 'gold',
  dashboard_density: 'comfortable',
  enable_tooltips: true,
  enable_animations: true,
  enable_quick_create: true,
  date_format: 'dd/MM/yyyy',
  time_format: '24h',
  week_starts_on: 'monday',
  default_home_page: 'dashboard',
  default_calendar_view: 'week',
  calendar_start_hour: 8,
  calendar_end_hour: 22,
  calendar_default_duration: 60,
  calendar_show_weekends: true,
  default_task_view: 'kanban',
  task_default_priority: 'media',
  task_show_completed: false,
  project_stale_days: 14,
  doc_default_category: null,
  doc_show_archived: false,
  assistant_enabled: true,
  assistant_daily_summary: true,
  assistant_weekly_review: true,
  assistant_tone: 'objetivo',
  assistant_suggest_reschedule: true,
  assistant_generate_tasks: true,
  assistant_require_confirm: true,
}

export const NOTIFICATION_DEFAULTS: Omit<NotificationSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  notify_task_due: true,
  notify_task_overdue: true,
  notify_meeting_reminder: true,
  notify_project_stalled: true,
  notify_routine_pending: true,
  notify_daily_summary: true,
  notify_weekly_review: true,
  daily_summary_time: '08:00',
  weekly_review_day: 'friday',
  weekly_review_time: '17:00',
}

export const SECURITY_DEFAULTS: Omit<SecuritySettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  two_factor_enabled: false,
  session_timeout_minutes: 120,
  login_alerts_enabled: true,
}
