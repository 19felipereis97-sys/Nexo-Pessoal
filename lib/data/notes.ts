'use server'

import { createClient } from '@/lib/supabase/server'
import type { Meeting, Note, Project, Task } from '@/lib/supabase/types'

export interface NotesData {
  notes: Note[]
  projects: Array<Pick<Project, 'id' | 'name'>>
  tasks: Array<Pick<Task, 'id' | 'title' | 'project_id'>>
  meetings: Array<Pick<Meeting, 'id' | 'title' | 'project_id'>>
  error?: string
}

export async function getNotesPageData(): Promise<NotesData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { notes: [], projects: [], tasks: [], meetings: [] }
  const [notes, projects, tasks, meetings] = await Promise.all([
    supabase.from('notes').select('*').eq('user_id', user.id).order('pinned', { ascending: false }).order('updated_at', { ascending: false }),
    supabase.from('projects').select('id, name').eq('user_id', user.id).order('name'),
    supabase.from('tasks').select('id, title, project_id').eq('user_id', user.id).neq('status', 'cancelado').order('title'),
    supabase.from('meetings').select('id, title, project_id').eq('user_id', user.id).order('scheduled_at', { ascending: false }),
  ])
  const error = notes.error?.message || projects.error?.message || tasks.error?.message || meetings.error?.message
  return {
    notes: (notes.data ?? []) as Note[],
    projects: (projects.data ?? []) as Array<Pick<Project, 'id' | 'name'>>,
    tasks: (tasks.data ?? []) as Array<Pick<Task, 'id' | 'title' | 'project_id'>>,
    meetings: (meetings.data ?? []) as Array<Pick<Meeting, 'id' | 'title' | 'project_id'>>,
    error,
  }
}
