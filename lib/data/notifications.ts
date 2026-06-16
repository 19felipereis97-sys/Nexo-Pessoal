'use server'

import { createClient } from '@/lib/supabase/server'
import type { Notification } from '@/lib/supabase/types'

interface AlertSeed {
  title: string
  message: string
  type: string
  severity: 'info' | 'warning' | 'danger' | 'success'
  entity_type: string
  entity_id: string
}

const STALE_DAYS = 14

function endAt(scheduledAt: string, durationMin: number) {
  return new Date(new Date(scheduledAt).getTime() + durationMin * 60000).toISOString()
}

async function generateNotificationsForUser(userId: string) {
  const supabase = await createClient()
  const now = new Date()
  const nowISO = now.toISOString()
  const today = nowISO.slice(0, 10)
  const soonISO = new Date(now.getTime() + 60 * 60 * 1000).toISOString()
  const staleBefore = new Date(now.getTime() - STALE_DAYS * 86400000).toISOString()
  const [overdue, critical, upcoming, stale, meetingsNoAgenda, meetingsRaw] = await Promise.all([
    supabase.from('tasks').select('id,title,due_date').eq('user_id', userId).lt('due_date', today).not('status', 'in', '("concluida","cancelado")').limit(30),
    supabase.from('tasks').select('id,title,due_date').eq('user_id', userId).eq('priority', 'critica').not('status', 'in', '("concluida","cancelado")').limit(30),
    supabase.from('calendar_events').select('id,title,start_at').eq('user_id', userId).gte('start_at', nowISO).lte('start_at', soonISO).limit(30),
    supabase.from('projects').select('id,name,updated_at').eq('user_id', userId).eq('status', 'em-andamento').lt('updated_at', staleBefore).limit(30),
    supabase.from('meetings').select('id,title,scheduled_at').eq('user_id', userId).in('status', ['agendada', 'reagendada']).or('agenda.is.null,agenda.eq.').limit(30),
    supabase.from('meetings').select('id,title,scheduled_at,duration_minutes,minutes').eq('user_id', userId).in('status', ['agendada', 'realizada', 'reagendada']).lte('scheduled_at', nowISO).limit(50),
  ])
  const alerts: AlertSeed[] = []
  ;(overdue.data ?? []).forEach((task) => alerts.push({ title: 'Tarefa vencida', message: `${task.title} venceu em ${task.due_date}.`, type: 'task_overdue', severity: 'danger', entity_type: 'task', entity_id: task.id }))
  ;(critical.data ?? []).forEach((task) => alerts.push({ title: 'Tarefa crítica pendente', message: `${task.title} está marcada como crítica.`, type: 'task_critical', severity: 'danger', entity_type: 'task', entity_id: task.id }))
  ;(upcoming.data ?? []).forEach((event) => alerts.push({ title: 'Compromisso próximo', message: `${event.title} começa às ${new Date(event.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`, type: 'event_upcoming', severity: 'info', entity_type: 'event', entity_id: event.id }))
  ;(stale.data ?? []).forEach((project) => alerts.push({ title: 'Projeto parado', message: `${project.name} está sem movimentação há mais de ${STALE_DAYS} dias.`, type: 'project_stale', severity: 'warning', entity_type: 'project', entity_id: project.id }))
  ;(meetingsNoAgenda.data ?? []).forEach((meeting) => alerts.push({ title: 'Reunião sem pauta', message: `${meeting.title} ainda não tem pauta registrada.`, type: 'meeting_no_agenda', severity: 'warning', entity_type: 'meeting', entity_id: meeting.id }))
  ;(meetingsRaw.data ?? []).filter((meeting) => !meeting.minutes && endAt(meeting.scheduled_at, meeting.duration_minutes) < nowISO).forEach((meeting) => alerts.push({ title: 'Reunião sem ata', message: `${meeting.title} terminou e ainda não tem ata.`, type: 'meeting_no_minutes', severity: 'warning', entity_type: 'meeting', entity_id: meeting.id }))
  if (alerts.length === 0) return
  await supabase.from('notifications').upsert(alerts.map((alert) => ({ ...alert, user_id: userId })), { onConflict: 'user_id,type,entity_type,entity_id', ignoreDuplicates: true })
}

export async function getNotificationsData(): Promise<{ notifications: Notification[]; unreadCount: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { notifications: [], unreadCount: 0 }
  await generateNotificationsForUser(user.id)
  const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(40)
  const notifications = (data ?? []) as Notification[]
  return { notifications, unreadCount: notifications.filter((notification) => !notification.read_at).length }
}
