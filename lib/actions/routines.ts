'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { todayISO } from '@/lib/utils/date'

export interface RoutineFields {
  title: string
  description?: string
  frequency: string
  days_of_week?: string[]
  target_time?: string
  area?: string
  project_id?: string | null
}

export async function createRoutine(fields: RoutineFields) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado', id: null }

  const { data, error } = await supabase
    .from('routines')
    .insert({
      user_id: user.id,
      title: fields.title.trim(),
      description: fields.description?.trim() || null,
      frequency: fields.frequency,
      days_of_week: fields.days_of_week?.length ? fields.days_of_week : null,
      target_time: fields.target_time || null,
      area: fields.area || null,
      project_id: fields.project_id || null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message, id: null }
  revalidatePath('/routines')
  revalidatePath('/hoje')
  return { error: null, id: data.id }
}

export async function updateRoutine(id: string, fields: Partial<RoutineFields>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const update: {
    updated_at: string
    title?: string
    description?: string | null
    frequency?: string
    days_of_week?: string[] | null
    target_time?: string | null
    area?: string | null
    project_id?: string | null
  } = { updated_at: new Date().toISOString() }
  if (fields.title !== undefined) update.title = fields.title.trim()
  if (fields.description !== undefined) update.description = fields.description?.trim() || null
  if (fields.frequency !== undefined) update.frequency = fields.frequency
  if (fields.days_of_week !== undefined) update.days_of_week = fields.days_of_week?.length ? fields.days_of_week : null
  if (fields.target_time !== undefined) update.target_time = fields.target_time || null
  if (fields.area !== undefined) update.area = fields.area || null
  if ('project_id' in fields) update.project_id = fields.project_id || null

  const { error } = await supabase.from('routines').update(update).eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/routines')
  revalidatePath('/hoje')
  return { error: null }
}

export async function archiveRoutine(id: string) {
  return updateRoutine(id, { frequency: undefined } as Partial<RoutineFields>).then(() =>
    updateRoutineStatus(id, 'archived')
  )
}

async function updateRoutineStatus(id: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('routines')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/routines')
  revalidatePath('/hoje')
  return { error: null }
}

export async function restoreRoutine(id: string) {
  return updateRoutineStatus(id, 'active')
}

export async function deleteRoutine(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('routines').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/routines')
  revalidatePath('/hoje')
  return { error: null }
}

export async function logRoutineComplete(routineId: string, referenceDate?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const date = referenceDate ?? todayISO()

  const { error } = await supabase.from('routine_logs').insert({
    routine_id: routineId,
    user_id: user.id,
    reference_date: date,
    completed_at: new Date().toISOString(),
  })

  // 23505 = unique_violation — already logged for this day
  if (error && error.code !== '23505') return { error: error.message }
  revalidatePath('/routines')
  revalidatePath('/hoje')
  return { error: null }
}

export async function unlogRoutineComplete(routineId: string, referenceDate?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const date = referenceDate ?? todayISO()

  const { error } = await supabase
    .from('routine_logs')
    .delete()
    .eq('routine_id', routineId)
    .eq('user_id', user.id)
    .eq('reference_date', date)

  if (error) return { error: error.message }
  revalidatePath('/routines')
  revalidatePath('/hoje')
  return { error: null }
}

// Checklist items

export async function addChecklistItem(routineId: string, title: string, position: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado', id: null }

  const { data, error } = await supabase
    .from('routine_checklist_items')
    .insert({ routine_id: routineId, user_id: user.id, title: title.trim(), position })
    .select('id')
    .single()

  if (error) return { error: error.message, id: null }
  revalidatePath('/routines')
  return { error: null, id: data.id }
}

export async function updateChecklistItem(id: string, title: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('routine_checklist_items')
    .update({ title: title.trim() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/routines')
  return { error: null }
}

export async function deleteChecklistItem(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('routine_checklist_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/routines')
  return { error: null }
}
