'use server'

import { createClient } from '@/lib/supabase/server'
import type { Meeting, Project, ProjectDecision, Task } from '@/lib/supabase/types'

export interface MeetingItem extends Meeting {
  project: Project | null
  decisions: ProjectDecision[]
  generatedTasks: Task[]
  hasCalendarEvent: boolean
}

export async function getMeetingsPageData(): Promise<{ meetings: MeetingItem[]; projects: Project[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { meetings: [], projects: [] }

  const [meetingsResult, projectsResult, decisionsResult, tasksResult, eventsResult] = await Promise.all([
    supabase.from('meetings').select('*').eq('user_id', user.id).order('scheduled_at', { ascending: false }),
    supabase.from('projects').select('*').eq('user_id', user.id).order('name'),
    supabase.from('project_decisions').select('*').eq('user_id', user.id).not('meeting_id', 'is', null).order('decided_at', { ascending: false }),
    supabase.from('tasks').select('*').eq('user_id', user.id).not('meeting_id', 'is', null).order('created_at', { ascending: false }),
    supabase.from('calendar_events').select('meeting_id').eq('user_id', user.id).not('meeting_id', 'is', null),
  ])
  const error = meetingsResult.error?.message || projectsResult.error?.message || decisionsResult.error?.message ||
    tasksResult.error?.message || eventsResult.error?.message
  if (error) return { meetings: [], projects: [], error }

  const projects = (projectsResult.data ?? []) as Project[]
  const projectMap = new Map(projects.map((project) => [project.id, project]))
  const decisions = (decisionsResult.data ?? []) as ProjectDecision[]
  const tasks = (tasksResult.data ?? []) as Task[]
  const eventIds = new Set((eventsResult.data ?? []).map((event) => event.meeting_id))
  return {
    projects,
    meetings: ((meetingsResult.data ?? []) as Meeting[]).map((meeting) => ({
      ...meeting,
      project: meeting.project_id ? projectMap.get(meeting.project_id) ?? null : null,
      decisions: decisions.filter((decision) => decision.meeting_id === meeting.id),
      generatedTasks: tasks.filter((task) => task.meeting_id === meeting.id),
      hasCalendarEvent: eventIds.has(meeting.id),
    })),
  }
}
