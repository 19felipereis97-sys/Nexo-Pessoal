'use server'

import { createClient } from '@/lib/supabase/server'
import { todayISO, saoPauloDayBoundsUTC } from '@/lib/utils/date'
import { isRoutineForDay } from '@/lib/utils/routines'
import type { CalendarEvent, DailyNote, DailyReview, FocusSession, Profile, Project, Routine, RoutineLog, Task } from '@/lib/supabase/types'

export interface TodayData {
  tasks: Task[]
  overdueTasks: Task[]
  events: CalendarEvent[]
  notes: DailyNote[]
  review: DailyReview | null
  activeFocus: FocusSession | null
  projects: Array<Pick<Project, 'id' | 'name'>>
  profile: Profile | null
  todayRoutines: Routine[]
  todayRoutineLogs: RoutineLog[]
  error?: string
}

export async function getTodayData(): Promise<TodayData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const empty: TodayData = { tasks: [], overdueTasks: [], events: [], notes: [], review: null, activeFocus: null, projects: [], profile: null, todayRoutines: [], todayRoutineLogs: [] }
  if (!user) return empty
  const today = todayISO()
  const { start, end } = saoPauloDayBoundsUTC(today)
  const [tasks, overdue, events, notes, review, focus, projects, profile] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', user.id).eq('due_date', today).neq('status', 'cancelado').order('execution_order', { ascending: true, nullsFirst: false }).order('due_time'),
    supabase.from('tasks').select('*').eq('user_id', user.id).lt('due_date', today).not('status', 'in', '("concluida","cancelado")').order('due_date').limit(20),
    supabase.from('calendar_events').select('*').eq('user_id', user.id).gte('start_at', start).lte('start_at', end).order('start_at'),
    supabase.from('daily_notes').select('*').eq('user_id', user.id).eq('note_date', today).order('created_at', { ascending: false }),
    supabase.from('daily_reviews').select('*').eq('user_id', user.id).eq('review_date', today).maybeSingle(),
    supabase.from('focus_sessions').select('*').eq('user_id', user.id).is('ended_at', null).order('started_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('projects').select('id, name').eq('user_id', user.id).neq('status', 'arquivado').order('name'),
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
  ])
  const error = tasks.error?.message || overdue.error?.message || events.error?.message || notes.error?.message ||
    review.error?.message || focus.error?.message || projects.error?.message || profile.error?.message

  // Routines (table may not exist yet — wrapped in try-catch)
  let todayRoutines: Routine[] = []
  let todayRoutineLogs: RoutineLog[] = []
  try {
    const [routinesRes, logsRes] = await Promise.all([
      supabase.from('routines').select('*').eq('user_id', user.id).eq('status', 'active'),
      supabase.from('routine_logs').select('*').eq('user_id', user.id).eq('reference_date', today),
    ])
    const allActive = (routinesRes.data ?? []) as Routine[]
    todayRoutines = allActive.filter((r) => isRoutineForDay(r, today))
    todayRoutineLogs = (logsRes.data ?? []) as RoutineLog[]
  } catch {
    // table not yet created
  }

  return {
    tasks: (tasks.data ?? []) as Task[], overdueTasks: (overdue.data ?? []) as Task[],
    events: (events.data ?? []) as CalendarEvent[], notes: (notes.data ?? []) as DailyNote[],
    review: review.data as DailyReview | null, activeFocus: focus.data as FocusSession | null,
    projects: (projects.data ?? []) as Array<Pick<Project, 'id' | 'name'>>, profile: profile.data as Profile | null,
    todayRoutines, todayRoutineLogs, error,
  }
}
