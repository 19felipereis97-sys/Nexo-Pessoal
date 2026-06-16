'use server'

import { createClient } from '@/lib/supabase/server'
import { todayISO, saoPauloDayBoundsUTC } from '@/lib/utils/date'
import type { Task, CalendarEvent, Project, Profile, Meeting, Note } from '@/lib/supabase/types'

export interface DashboardData {
  todayTasks: Task[]
  overdueTasks: Task[]
  todayEvents: CalendarEvent[]
  upcomingEvents: CalendarEvent[]
  activeProjects: Project[]
  staleProjects: Project[]
  todayMeetings: Meeting[]
  upcomingMeetings: Meeting[]
  meetingsWithoutMinutes: Meeting[]
  recentNotes: Note[]
  profile: Profile | null
  error: string | null
}

const PRIORITY_ORDER: Record<string, number> = {
  critica: 0,
  urgente: 0,
  alta: 1,
  média: 2,
  baixa: 3,
}

const STALE_DAYS = 14

function sortByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 9
    const pb = PRIORITY_ORDER[b.priority] ?? 9
    if (pa !== pb) return pa - pb
    if (a.due_time && b.due_time) return a.due_time.localeCompare(b.due_time)
    if (a.due_time) return -1
    if (b.due_time) return 1
    return 0
  })
}

function emptyData(error: string | null = null): DashboardData {
  return {
    todayTasks: [],
    overdueTasks: [],
    todayEvents: [],
    upcomingEvents: [],
    activeProjects: [],
    staleProjects: [],
    todayMeetings: [],
    upcomingMeetings: [],
    meetingsWithoutMinutes: [],
    recentNotes: [],
    profile: null,
    error,
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return emptyData()

    const now = new Date()
    const nowISO = now.toISOString()
    const todayStr = todayISO()
    const { start: dayStart, end: dayEnd } = saoPauloDayBoundsUTC(todayStr)
    const staleBefore = new Date(now.getTime() - STALE_DAYS * 86400000).toISOString()

    const [
      { data: todayTasksRaw },
      { data: overdueTasksRaw },
      { data: todayEventsRaw },
      { data: upcomingEventsRaw },
      { data: activeProjectsRaw },
      { data: todayMeetingsRaw },
      { data: upcomingMeetingsRaw },
      { data: meetingsNoMinutesRaw },
      { data: recentNotesRaw },
      { data: profileData },
    ] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('due_date', todayStr)
        .not('status', 'in', '("concluida","cancelado")'),

      supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .lt('due_date', todayStr)
        .not('status', 'in', '("concluida","cancelado")')
        .order('due_date', { ascending: true })
        .limit(12),

      supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_at', dayStart)
        .lte('start_at', dayEnd)
        .order('start_at', { ascending: true }),

      supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gt('start_at', nowISO)
        .order('start_at', { ascending: true })
        .limit(6),

      supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'em-andamento')
        .order('due_date', { ascending: true })
        .limit(20),

      supabase
        .from('meetings')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_at', dayStart)
        .lte('scheduled_at', dayEnd)
        .order('scheduled_at', { ascending: true }),

      supabase
        .from('meetings')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_at', nowISO)
        .in('status', ['agendada', 'reagendada'])
        .order('scheduled_at', { ascending: true })
        .limit(5),

      supabase
        .from('meetings')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'realizada')
        .is('minutes', null)
        .order('scheduled_at', { ascending: false })
        .limit(5),

      supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5),

      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single(),
    ])

    const allActiveProjects = (activeProjectsRaw ?? []) as Project[]
    const staleProjects = allActiveProjects.filter((p) => p.updated_at < staleBefore)

    return {
      todayTasks: sortByPriority((todayTasksRaw ?? []) as Task[]),
      overdueTasks: (overdueTasksRaw ?? []) as Task[],
      todayEvents: (todayEventsRaw ?? []) as CalendarEvent[],
      upcomingEvents: (upcomingEventsRaw ?? []) as CalendarEvent[],
      activeProjects: allActiveProjects.slice(0, 6),
      staleProjects,
      todayMeetings: (todayMeetingsRaw ?? []) as Meeting[],
      upcomingMeetings: (upcomingMeetingsRaw ?? []) as Meeting[],
      meetingsWithoutMinutes: (meetingsNoMinutesRaw ?? []) as Meeting[],
      recentNotes: (recentNotesRaw ?? []) as Note[],
      profile: (profileData as Profile | null) ?? null,
      error: null,
    }
  } catch {
    return emptyData('Não foi possível carregar os dados. Verifique sua conexão.')
  }
}
