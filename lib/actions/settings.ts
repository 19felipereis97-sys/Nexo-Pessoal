'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

function revalidate() { revalidatePath('/settings') }

// ── Profile ───────────────────────────────────────────────────────

export interface ProfileFields {
  full_name?: string
  role?: string
  timezone?: string
  locale?: string
  avatar_url?: string
}

export async function saveProfile(fields: ProfileFields) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('profiles')
    .upsert({ id: user.id, ...fields, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidate()
  return { error: null }
}

// ── User settings (generic upsert) ───────────────────────────────

export async function saveUserSettings(fields: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('user_settings').upsert(
    { user_id: user.id, ...fields, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  )
  if (error) return { error: error.message }
  revalidate()
  return { error: null }
}

// ── Notification settings ─────────────────────────────────────────

export interface NotificationFields {
  notify_task_due?: boolean
  notify_task_overdue?: boolean
  notify_meeting_reminder?: boolean
  notify_project_stalled?: boolean
  notify_routine_pending?: boolean
  notify_daily_summary?: boolean
  notify_weekly_review?: boolean
  daily_summary_time?: string | null
  weekly_review_day?: string | null
  weekly_review_time?: string | null
}

export async function saveNotificationSettings(fields: NotificationFields) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('notification_settings').upsert(
    { user_id: user.id, ...fields, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  )
  if (error) return { error: error.message }
  revalidate()
  return { error: null }
}

// ── Security settings ─────────────────────────────────────────────

export interface SecurityFields {
  session_timeout_minutes?: number
  login_alerts_enabled?: boolean
}

export async function saveSecuritySettings(fields: SecurityFields) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('security_settings').upsert(
    { user_id: user.id, ...fields, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  )
  if (error) return { error: error.message }
  revalidate()
  return { error: null }
}

// ── Password reset ────────────────────────────────────────────────

export async function sendPasswordReset() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'Não autenticado' }

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/settings`,
  })
  if (error) return { error: error.message }
  return { error: null }
}

// ── Export user data ──────────────────────────────────────────────

export async function exportUserData(): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autenticado' }

  try {
    const [profileRes, tasksRes, projectsRes, meetingsRes, notesRes, routinesRes, settingsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('tasks').select('id,title,status,priority,due_date,created_at').eq('user_id', user.id).limit(500),
      supabase.from('projects').select('id,name,status,progress,created_at').eq('user_id', user.id).limit(100),
      supabase.from('meetings').select('id,title,status,scheduled_at,created_at').eq('user_id', user.id).limit(200),
      supabase.from('notes').select('id,title,type,created_at').eq('user_id', user.id).limit(500),
      supabase.from('routines').select('id,title,frequency,status,created_at').eq('user_id', user.id).limit(100),
      supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle(),
    ])

    const exportData = {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      email: user.email,
      profile: profileRes.data,
      settings: settingsRes.data,
      stats: {
        tasks: tasksRes.data?.length ?? 0,
        projects: projectsRes.data?.length ?? 0,
        meetings: meetingsRes.data?.length ?? 0,
        notes: notesRes.data?.length ?? 0,
        routines: routinesRes.data?.length ?? 0,
      },
      tasks: tasksRes.data ?? [],
      projects: projectsRes.data ?? [],
      meetings: meetingsRes.data ?? [],
      notes: notesRes.data ?? [],
      routines: routinesRes.data ?? [],
    }

    // Log to activity_logs
    try {
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        entity_type: 'settings',
        entity_id: user.id,
        action: 'export_data',
      })
    } catch { /* non-fatal */ }

    return { data: exportData, error: null }
  } catch {
    return { data: null, error: 'Erro ao exportar dados.' }
  }
}
