'use server'

import { createClient } from '@/lib/supabase/server'
import { saoPauloDayBoundsUTC, todayISO } from '@/lib/utils/date'
import type {
  CalendarEvent, Document, FocusSession, Meeting, Note,
  Project, ProjectDecision, ReportReview, Routine, RoutineLog, Task, WeeklyReview,
} from '@/lib/supabase/types'

export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'custom'

export interface ReportData {
  period: { start: string; end: string; type: PeriodType }
  // Tasks
  completedTasks: Task[]
  overdueTasks: Task[]
  pendingTasks: Task[]
  // Projects
  progressedProjects: Project[]
  staleProjects: Project[]
  // Meetings
  meetingsDone: Meeting[]
  meetingsNoMinutes: Meeting[]
  // Other
  decisions: ProjectDecision[]
  notesCreated: Note[]
  eventsInPeriod: CalendarEvent[]
  focusSessions: FocusSession[]
  // Routines
  routinesActive: Routine[]
  routineLogsInPeriod: RoutineLog[]
  // Documents
  documentsInPeriod: Document[]
  // Meta
  allProjects: Array<Pick<Project, 'id' | 'name'>>
  weeklyReview: WeeklyReview | null
  savedReviews: ReportReview[]
  error: string | null
}

const STALE_DAYS = 14

function emptyData(period: ReportData['period'], error: string | null = null): ReportData {
  return {
    period, completedTasks: [], overdueTasks: [], pendingTasks: [],
    progressedProjects: [], staleProjects: [], meetingsDone: [], meetingsNoMinutes: [],
    decisions: [], notesCreated: [], eventsInPeriod: [], focusSessions: [],
    routinesActive: [], routineLogsInPeriod: [], documentsInPeriod: [],
    allProjects: [], weeklyReview: null, savedReviews: [], error,
  }
}

export async function getReportData(
  periodStart: string,
  periodEnd: string,
  periodType: PeriodType,
  projectId?: string | null,
): Promise<ReportData> {
  const period = { start: periodStart, end: periodEnd, type: periodType }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return emptyData(period)

    const { start: rangeStart } = saoPauloDayBoundsUTC(periodStart)
    const { end: rangeEnd } = saoPauloDayBoundsUTC(periodEnd)
    const today = todayISO()
    const staleBefore = new Date(Date.now() - STALE_DAYS * 86400000).toISOString()
    const pid = projectId || undefined

    function withProject<T>(q: T & { eq: (col: string, val: string) => T }): T {
      return pid ? q.eq('project_id', pid) : q
    }

    const [
      completedResult,
      overdueResult,
      pendingResult,
      projectsResult,
      meetingsDoneResult,
      meetingsNoMinResult,
      decisionsResult,
      notesResult,
      eventsResult,
      focusResult,
      allProjectsResult,
      routinesResult,
      routineLogsResult,
      documentsResult,
    ] = await Promise.all([
      // Completed tasks in period
      withProject(
        supabase.from('tasks').select('*').eq('user_id', user.id).eq('status', 'concluida')
          .gte('completed_at', rangeStart).lte('completed_at', rangeEnd).order('completed_at', { ascending: false }),
      ),
      // Overdue tasks (current state)
      withProject(
        supabase.from('tasks').select('*').eq('user_id', user.id).lt('due_date', today)
          .not('status', 'in', '("concluida","cancelado")').order('due_date', { ascending: true }).limit(30),
      ),
      // Pending tasks (due in period, not completed)
      withProject(
        supabase.from('tasks').select('*').eq('user_id', user.id)
          .gte('due_date', periodStart).lte('due_date', periodEnd)
          .not('status', 'in', '("concluida","cancelado")').order('due_date', { ascending: true }).limit(50),
      ),
      // Active projects
      supabase.from('projects').select('*').eq('user_id', user.id).eq('status', 'em-andamento')
        .order('updated_at', { ascending: false }).limit(50),
      // Meetings done in period
      withProject(
        supabase.from('meetings').select('*').eq('user_id', user.id).eq('status', 'realizada')
          .gte('scheduled_at', rangeStart).lte('scheduled_at', rangeEnd).order('scheduled_at', { ascending: false }),
      ),
      // Meetings without minutes
      withProject(
        supabase.from('meetings').select('*').eq('user_id', user.id).eq('status', 'realizada')
          .is('minutes', null).order('scheduled_at', { ascending: false }).limit(10),
      ),
      // Decisions in period
      withProject(
        supabase.from('project_decisions').select('*').eq('user_id', user.id)
          .gte('created_at', rangeStart).lte('created_at', rangeEnd).order('created_at', { ascending: false }),
      ),
      // Notes created in period
      withProject(
        supabase.from('notes').select('*').eq('user_id', user.id)
          .gte('created_at', rangeStart).lte('created_at', rangeEnd).order('created_at', { ascending: false }),
      ),
      // Events in period
      withProject(
        supabase.from('calendar_events').select('*').eq('user_id', user.id)
          .gte('start_at', rangeStart).lte('start_at', rangeEnd).order('start_at', { ascending: true }),
      ),
      // Focus sessions in period
      supabase.from('focus_sessions').select('*').eq('user_id', user.id)
        .gte('started_at', rangeStart).lte('started_at', rangeEnd).not('ended_at', 'is', null),
      // All projects for filter
      supabase.from('projects').select('id, name').eq('user_id', user.id).neq('status', 'arquivado')
        .order('name').limit(100),
      // Active routines
      supabase.from('routines').select('*').eq('user_id', user.id).eq('status', 'active')
        .order('title').limit(100),
      // Routine logs in period
      supabase.from('routine_logs').select('*').eq('user_id', user.id)
        .gte('reference_date', periodStart).lte('reference_date', periodEnd),
      // Documents in period
      supabase.from('documents').select('*').eq('user_id', user.id)
        .gte('uploaded_at', rangeStart).lte('uploaded_at', rangeEnd).eq('status', 'active')
        .order('uploaded_at', { ascending: false }),
    ])

    const allActiveProjects = (projectsResult.data ?? []) as Project[]
    const progressedProjects = allActiveProjects.filter((p) => p.updated_at >= rangeStart && p.updated_at <= rangeEnd)
    const staleProjects = allActiveProjects.filter((p) => p.updated_at < staleBefore)

    // Weekly review (keep for weekly view backward compat)
    let weeklyReview: WeeklyReview | null = null
    try {
      if (periodType === 'weekly') {
        const { data: reviewData } = await supabase
          .from('weekly_reviews').select('*').eq('user_id', user.id).eq('week_start', periodStart).maybeSingle()
        weeklyReview = (reviewData as WeeklyReview | null) ?? null
      }
    } catch { weeklyReview = null }

    // Saved report reviews
    let savedReviews: ReportReview[] = []
    try {
      const { data: reviewsData } = await supabase
        .from('report_reviews').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(50)
      savedReviews = (reviewsData as ReportReview[]) ?? []
    } catch { savedReviews = [] }

    return {
      period,
      completedTasks: (completedResult.data ?? []) as Task[],
      overdueTasks: (overdueResult.data ?? []) as Task[],
      pendingTasks: (pendingResult.data ?? []) as Task[],
      progressedProjects: pid ? allActiveProjects.filter((p) => p.id === pid) : progressedProjects,
      staleProjects,
      meetingsDone: (meetingsDoneResult.data ?? []) as Meeting[],
      meetingsNoMinutes: (meetingsNoMinResult.data ?? []) as Meeting[],
      decisions: (decisionsResult.data ?? []) as ProjectDecision[],
      notesCreated: (notesResult.data ?? []) as Note[],
      eventsInPeriod: (eventsResult.data ?? []) as CalendarEvent[],
      focusSessions: (focusResult.data ?? []) as FocusSession[],
      routinesActive: (routinesResult.data ?? []) as Routine[],
      routineLogsInPeriod: (routineLogsResult.data ?? []) as RoutineLog[],
      documentsInPeriod: (documentsResult.data ?? []) as Document[],
      allProjects: (allProjectsResult.data ?? []) as Array<Pick<Project, 'id' | 'name'>>,
      weeklyReview,
      savedReviews,
      error: null,
    }
  } catch {
    return emptyData(period, 'Não foi possível carregar os dados do relatório.')
  }
}
