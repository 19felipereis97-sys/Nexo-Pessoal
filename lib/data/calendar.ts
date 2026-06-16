'use server'

import { createClient } from '@/lib/supabase/server'
import type { CalendarEvent, Project } from '@/lib/supabase/types'

export interface CalendarPageData {
  events: CalendarEvent[]
  projects: Array<Pick<Project, 'id' | 'name'>>
  error?: string
}

export async function getCalendarPageData(): Promise<CalendarPageData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { events: [], projects: [] }

  const [eventsResult, projectsResult] = await Promise.all([
    supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .order('start_at', { ascending: true }),
    supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', user.id)
      .order('name'),
  ])

  return {
    events: eventsResult.data ?? [],
    projects: (projectsResult.data ?? []) as Array<Pick<Project, 'id' | 'name'>>,
    error: eventsResult.error?.message,
  }
}
