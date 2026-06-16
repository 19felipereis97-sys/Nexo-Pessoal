'use server'

import { createClient } from '@/lib/supabase/server'
import { addDaysISO, todayISO } from '@/lib/utils/date'
import { isRoutineForDay } from '@/lib/utils/routines'
import type { Project, Routine, RoutineChecklistItem, RoutineLog } from '@/lib/supabase/types'

export interface RoutinesData {
  routines: Routine[]
  checklistItems: RoutineChecklistItem[]
  logs: RoutineLog[]
  projects: Array<Pick<Project, 'id' | 'name'>>
  today: string
  error: string | null
}

export async function getRoutinesData(): Promise<RoutinesData> {
  const today = todayISO()
  const empty: RoutinesData = { routines: [], checklistItems: [], logs: [], projects: [], today, error: null }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ...empty, error: 'Não autenticado' }

    // Fetch logs for the last 90 days
    const since = addDaysISO(today, -90)

    const [routinesResult, checklistResult, logsResult, projectsResult] = await Promise.all([
      supabase.from('routines').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('routine_checklist_items').select('*').eq('user_id', user.id).order('position'),
      supabase.from('routine_logs').select('*').eq('user_id', user.id).gte('reference_date', since).order('reference_date', { ascending: false }),
      supabase.from('projects').select('id, name').eq('user_id', user.id).neq('status', 'arquivado').order('name').limit(100),
    ])

    if (routinesResult.error) return { ...empty, error: routinesResult.error.message }

    return {
      routines: (routinesResult.data ?? []) as Routine[],
      checklistItems: (checklistResult.data ?? []) as RoutineChecklistItem[],
      logs: (logsResult.data ?? []) as RoutineLog[],
      projects: (projectsResult.data ?? []) as Array<Pick<Project, 'id' | 'name'>>,
      today,
      error: null,
    }
  } catch {
    return { ...empty, error: 'Não foi possível carregar as rotinas.' }
  }
}

export async function getTodayRoutines(): Promise<{ routines: Routine[]; logs: RoutineLog[]; today: string }> {
  const today = todayISO()
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { routines: [], logs: [], today }

    const [routinesResult, logsResult] = await Promise.all([
      supabase.from('routines').select('*').eq('user_id', user.id).eq('status', 'active'),
      supabase.from('routine_logs').select('*').eq('user_id', user.id).eq('reference_date', today),
    ])

    const allRoutines = (routinesResult.data ?? []) as Routine[]
    const todayRoutines = allRoutines.filter((r) => isRoutineForDay(r, today))

    return {
      routines: todayRoutines,
      logs: (logsResult.data ?? []) as RoutineLog[],
      today,
    }
  } catch {
    return { routines: [], logs: [], today }
  }
}
