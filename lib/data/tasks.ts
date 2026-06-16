'use server'

import { createClient } from '@/lib/supabase/server'
import type { Task, Project } from '@/lib/supabase/types'

export interface TasksPageData {
  tasks: Task[]
  projects: Array<Pick<Project, 'id' | 'name'>>
  error?: string
}

export async function getTasksPageData(): Promise<TasksPageData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { tasks: [], projects: [] }

  const [tasksResult, projectsResult] = await Promise.all([
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', user.id)
      .order('name'),
  ])

  return {
    tasks: tasksResult.data ?? [],
    projects: (projectsResult.data ?? []) as Array<Pick<Project, 'id' | 'name'>>,
    error: tasksResult.error?.message,
  }
}
