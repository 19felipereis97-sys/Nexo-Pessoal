'use server'

import { createClient } from '@/lib/supabase/server'
import type { CalendarEvent, Meeting, Note, Project, ProjectDecision, Task } from '@/lib/supabase/types'

export interface ProjectSummary extends Project {
  taskTotal: number
  taskDone: number
  overdueTasks: number
  computedProgress: number
  isStale: boolean
}

export interface ProjectDetailData {
  project: ProjectSummary | null
  tasks: Task[]
  events: CalendarEvent[]
  meetings: Meeting[]
  notes: Note[]
  decisions: ProjectDecision[]
  error?: string
}

const DONE = new Set(['concluida', 'concluído'])

function summarize(project: Project, tasks: Task[]): ProjectSummary {
  const activeTasks = tasks.filter((task) => task.status !== 'cancelado')
  const taskDone = activeTasks.filter((task) => DONE.has(task.status)).length
  const today = new Date().toISOString().slice(0, 10)
  const overdueTasks = activeTasks.filter((task) => task.due_date && task.due_date < today && !DONE.has(task.status)).length
  const computedProgress = activeTasks.length ? Math.round((taskDone / activeTasks.length) * 100) : 0
  const staleAt = Date.now() - 14 * 24 * 60 * 60 * 1000
  return {
    ...project,
    progress: computedProgress,
    taskTotal: activeTasks.length,
    taskDone,
    overdueTasks,
    computedProgress,
    isStale: new Date(project.updated_at).getTime() < staleAt && !['concluido', 'arquivado'].includes(project.status),
  }
}

export async function getProjectsPageData(): Promise<{ projects: ProjectSummary[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { projects: [] }

  const [projectsResult, tasksResult] = await Promise.all([
    supabase.from('projects').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('tasks').select('*').eq('user_id', user.id),
  ])
  const error = projectsResult.error?.message || tasksResult.error?.message
  if (error) return { projects: [], error }
  const tasks = (tasksResult.data ?? []) as Task[]
  return {
    projects: ((projectsResult.data ?? []) as Project[]).map((project) =>
      summarize(project, tasks.filter((task) => task.project_id === project.id)),
    ),
  }
}

export async function getProjectDetailData(projectId: string): Promise<ProjectDetailData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { project: null, tasks: [], events: [], meetings: [], notes: [], decisions: [] }

  const [projectResult, tasksResult, eventsResult, meetingsResult, notesResult, decisionsResult] = await Promise.all([
    supabase.from('projects').select('*').eq('id', projectId).eq('user_id', user.id).maybeSingle(),
    supabase.from('tasks').select('*').eq('project_id', projectId).eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('calendar_events').select('*').eq('project_id', projectId).eq('user_id', user.id).order('start_at'),
    supabase.from('meetings').select('*').eq('project_id', projectId).eq('user_id', user.id).order('scheduled_at', { ascending: false }),
    supabase.from('notes').select('*').eq('project_id', projectId).eq('user_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('project_decisions').select('*').eq('project_id', projectId).eq('user_id', user.id).order('decided_at', { ascending: false }),
  ])
  const error = projectResult.error?.message || tasksResult.error?.message || eventsResult.error?.message ||
    meetingsResult.error?.message || notesResult.error?.message || decisionsResult.error?.message
  const tasks = (tasksResult.data ?? []) as Task[]
  return {
    project: projectResult.data ? summarize(projectResult.data as Project, tasks) : null,
    tasks,
    events: (eventsResult.data ?? []) as CalendarEvent[],
    meetings: (meetingsResult.data ?? []) as Meeting[],
    notes: (notesResult.data ?? []) as Note[],
    decisions: (decisionsResult.data ?? []) as ProjectDecision[],
    error,
  }
}
