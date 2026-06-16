'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { PeriodType } from '@/lib/data/reports'

export interface WeeklyReviewFields {
  summary: string
  wins: string
  pending_items: string
  next_focus: string
}

export async function saveWeeklyReview(weekStart: string, weekEnd: string, fields: WeeklyReviewFields) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  if (!weekStart || !weekEnd) return { error: 'Período inválido' }

  const { error } = await supabase
    .from('weekly_reviews')
    .upsert(
      {
        user_id: user.id,
        week_start: weekStart,
        week_end: weekEnd,
        summary: fields.summary.trim() || null,
        wins: fields.wins.trim() || null,
        pending_items: fields.pending_items.trim() || null,
        next_focus: fields.next_focus.trim() || null,
      },
      { onConflict: 'user_id,week_start' },
    )

  if (error) return { error: error.message }
  revalidatePath('/reports')
  return { error: null }
}

export interface SaveReportReviewInput {
  type: PeriodType
  period_start: string
  period_end: string
  title: string
  summary?: string | null
  completed_tasks: number
  pending_tasks: number
  overdue_tasks: number
  completed_routines: number
  total_routines: number
  meetings_count: number
  notes_count: number
  documents_count: number
  active_projects: number
  stalled_projects: number
  wins?: string | null
  pending_items?: string | null
  next_focus?: string | null
}

export async function saveReportReview(input: SaveReportReviewInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado', id: null }

  const { data, error } = await supabase.from('report_reviews').insert({
    user_id: user.id,
    type: input.type,
    period_start: input.period_start,
    period_end: input.period_end,
    title: input.title.trim(),
    summary: input.summary?.trim() || null,
    completed_tasks: input.completed_tasks,
    pending_tasks: input.pending_tasks,
    overdue_tasks: input.overdue_tasks,
    completed_routines: input.completed_routines,
    total_routines: input.total_routines,
    meetings_count: input.meetings_count,
    notes_count: input.notes_count,
    documents_count: input.documents_count,
    active_projects: input.active_projects,
    stalled_projects: input.stalled_projects,
    wins: input.wins?.trim() || null,
    pending_items: input.pending_items?.trim() || null,
    next_focus: input.next_focus?.trim() || null,
  }).select('id').single()

  if (error) return { error: error.message, id: null }
  revalidatePath('/reports')
  return { error: null, id: data.id as string }
}

export async function deleteReportReview(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('report_reviews').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/reports')
  return { error: null }
}
