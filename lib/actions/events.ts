'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

function revalidate() {
  revalidatePath('/dashboard')
  revalidatePath('/calendar')
  revalidatePath('/projects')
}

export interface CreateEventInput {
  title: string
  description?: string
  start_at: string
  end_at: string
  type?: string
  location?: string
  project_id?: string
  meeting_id?: string
}

const EVENT_TYPES = ['compromisso', 'reunião', 'prazo', 'foco', 'pessoal', 'trabalho', 'estudo']

function validateRange(start: string | undefined, end: string | undefined) {
  if (!start || !end) return 'Data/hora obrigatória'
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 'Data/hora inválida'
  if (endDate <= startDate) return 'O término deve ser depois do início'
  return null
}

function normalizeType(type: string | undefined) {
  return type && EVENT_TYPES.includes(type) ? type : 'compromisso'
}

export async function createCalendarEvent(input: CreateEventInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado', event: null }

  if (!input.title.trim()) return { error: 'Título é obrigatório', event: null }
  const rangeError = validateRange(input.start_at, input.end_at)
  if (rangeError) return { error: rangeError, event: null }

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      start_at: input.start_at,
      end_at: input.end_at,
      type: normalizeType(input.type),
      location: input.location?.trim() || null,
      project_id: input.project_id || null,
      meeting_id: input.meeting_id || null,
    })
    .select()
    .single()

  if (error) return { error: error.message, event: null }
  revalidate()
  if (data.project_id) revalidatePath(`/projects/${data.project_id}`)
  return { error: null, event: data }
}

export async function updateCalendarEvent(
  eventId: string,
  input: Partial<CreateEventInput>,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  const { data: existing } = await supabase.from('calendar_events').select('meeting_id').eq('id', eventId).eq('user_id', user.id).maybeSingle()
  if (existing?.meeting_id) return { error: 'Edite este compromisso pelo módulo de reuniões para manter os dados sincronizados.' }
  const rangeError = validateRange(input.start_at, input.end_at)
  if (rangeError) return { error: rangeError }

  const { error } = await supabase
    .from('calendar_events')
    .update({
      ...input,
      type: input.type ? normalizeType(input.type) : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidate()
  return { error: null }
}

export async function deleteCalendarEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  const { data: existing } = await supabase.from('calendar_events').select('meeting_id').eq('id', eventId).eq('user_id', user.id).maybeSingle()
  if (existing?.meeting_id) return { error: 'Exclua este compromisso pelo módulo de reuniões para escolher se o evento deve ser mantido.' }

  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidate()
  return { error: null }
}
