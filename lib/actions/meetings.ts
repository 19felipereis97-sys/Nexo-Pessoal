'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface MeetingInput {
  title: string
  description?: string
  project_id: string
  scheduled_at: string
  duration_minutes: number
  location: string
  participants: string[]
  agenda: string
  minutes?: string
  next_steps?: string
  status: string
}

function eventEnd(start: string, duration: number) {
  return new Date(new Date(start).getTime() + duration * 60000).toISOString()
}

function revalidate(meetingId?: string, projectId?: string) {
  revalidatePath('/dashboard')
  revalidatePath('/meetings')
  revalidatePath('/calendar')
  revalidatePath('/projects')
  if (projectId) revalidatePath(`/projects/${projectId}`)
  if (meetingId) revalidatePath(`/meetings/${meetingId}`)
}

function validate(input: MeetingInput) {
  if (!input.title.trim()) return 'Título é obrigatório'
  if (!input.project_id) return 'Projeto vinculado é obrigatório'
  if (!input.scheduled_at) return 'Data e hora são obrigatórias'
  if (!input.duration_minutes || input.duration_minutes < 1) return 'Duração é obrigatória'
  if (!input.location.trim()) return 'Local ou link é obrigatório'
  if (!input.participants.filter(Boolean).length) return 'Informe ao menos um participante'
  if (!input.agenda.trim()) return 'Pauta é obrigatória'
  return null
}

export async function createMeeting(input: MeetingInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado', meeting: null }
  const validation = validate(input)
  if (validation) return { error: validation, meeting: null }

  const { data: meeting, error } = await supabase.from('meetings').insert({
    user_id: user.id,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    project_id: input.project_id,
    scheduled_at: input.scheduled_at,
    duration_minutes: input.duration_minutes,
    location: input.location.trim(),
    participants: input.participants.map((item) => item.trim()).filter(Boolean),
    agenda: input.agenda.trim(),
    minutes: input.minutes?.trim() || null,
    next_steps: input.next_steps?.trim() || null,
    status: input.status || 'agendada',
  }).select().single()
  if (error || !meeting) return { error: error?.message ?? 'Erro ao criar reunião', meeting: null }

  const { error: eventError } = await supabase.from('calendar_events').insert({
    user_id: user.id,
    title: meeting.title,
    description: meeting.agenda,
    start_at: meeting.scheduled_at,
    end_at: eventEnd(meeting.scheduled_at, meeting.duration_minutes),
    type: 'reunião',
    location: meeting.location,
    project_id: meeting.project_id,
    meeting_id: meeting.id,
  })
  if (eventError) {
    await supabase.from('meetings').delete().eq('id', meeting.id).eq('user_id', user.id)
    return { error: `A reunião não foi criada porque o evento falhou: ${eventError.message}`, meeting: null }
  }
  revalidate(meeting.id, meeting.project_id ?? undefined)
  return { error: null, meeting }
}

export async function updateMeeting(meetingId: string, input: MeetingInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  const validation = validate(input)
  if (validation) return { error: validation }

  const { error } = await supabase.from('meetings').update({
    title: input.title.trim(),
    description: input.description?.trim() || null,
    project_id: input.project_id,
    scheduled_at: input.scheduled_at,
    duration_minutes: input.duration_minutes,
    location: input.location.trim(),
    participants: input.participants.map((item) => item.trim()).filter(Boolean),
    agenda: input.agenda.trim(),
    minutes: input.minutes?.trim() || null,
    next_steps: input.next_steps?.trim() || null,
    status: input.status,
  }).eq('id', meetingId).eq('user_id', user.id)
  if (error) return { error: error.message }

  const eventData = {
    title: input.title.trim(),
    description: input.agenda.trim(),
    start_at: input.scheduled_at,
    end_at: eventEnd(input.scheduled_at, input.duration_minutes),
    type: 'reunião',
    location: input.location.trim(),
    project_id: input.project_id,
  }
  const { data: event } = await supabase.from('calendar_events').select('id').eq('meeting_id', meetingId).eq('user_id', user.id).maybeSingle()
  const eventResult = event
    ? await supabase.from('calendar_events').update(eventData).eq('id', event.id).eq('user_id', user.id)
    : await supabase.from('calendar_events').insert({ ...eventData, user_id: user.id, meeting_id: meetingId })
  if (eventResult.error) return { error: `Reunião salva, mas a agenda não foi atualizada: ${eventResult.error.message}` }
  revalidate(meetingId, input.project_id)
  return { error: null }
}

export async function deleteMeeting(meetingId: string, removeCalendarEvent: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  const { data: meeting } = await supabase.from('meetings').select('project_id').eq('id', meetingId).eq('user_id', user.id).maybeSingle()
  if (removeCalendarEvent) {
    const { error } = await supabase.from('calendar_events').delete().eq('meeting_id', meetingId).eq('user_id', user.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('calendar_events').update({ meeting_id: null }).eq('meeting_id', meetingId).eq('user_id', user.id)
    if (error) return { error: error.message }
  }
  const { error } = await supabase.from('meetings').delete().eq('id', meetingId).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidate(undefined, meeting?.project_id ?? undefined)
  return { error: null }
}

export async function createMeetingDecision(meetingId: string, title: string, description?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado', decision: null }
  if (!title.trim()) return { error: 'Decisão é obrigatória', decision: null }
  const { data: meeting } = await supabase.from('meetings').select('project_id').eq('id', meetingId).eq('user_id', user.id).maybeSingle()
  if (!meeting?.project_id) return { error: 'Reunião sem projeto vinculado', decision: null }
  const { data, error } = await supabase.from('project_decisions').insert({
    user_id: user.id, project_id: meeting.project_id, meeting_id: meetingId,
    title: title.trim(), description: description?.trim() || null,
  }).select().single()
  if (error) return { error: error.message, decision: null }
  revalidate(meetingId, meeting.project_id)
  return { error: null, decision: data }
}
