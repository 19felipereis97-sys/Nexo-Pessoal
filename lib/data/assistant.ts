'use server'

import { createClient } from '@/lib/supabase/server'
import { todayISO, saoPauloDayBoundsUTC } from '@/lib/utils/date'
import type { CalendarEvent, Meeting, Project, Task } from '@/lib/supabase/types'
import type { AIInteraction } from '@/lib/types/ai'

export async function getAIHistory(limit = 10): Promise<AIInteraction[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []
    const { data } = await supabase
      .from('ai_interactions')
      .select('id,user_id,mode,question,answer,feedback,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)
    return (data ?? []) as AIInteraction[]
  } catch {
    return []
  }
}

export type AssistantEntityType = 'task' | 'event' | 'project' | 'meeting' | 'planning'
export type AssistantSeverity = 'info' | 'warning' | 'danger' | 'success'

export interface AssistantRecommendation {
  id: string
  title: string
  description: string
  reason: string
  entityType: AssistantEntityType
  entityId?: string
  href: string
  severity: AssistantSeverity
  meta?: string
}

export interface AssistantPanel {
  id: string
  title: string
  description: string
  emptyTitle: string
  emptyDescription: string
  items: AssistantRecommendation[]
}

export interface AssistantData {
  todayLabel: string
  summary: {
    todayTasks: number
    overdueTasks: number
    todayEvents: number
    criticalNotStarted: number
    staleProjects: number
    meetingsWithoutMinutes: number
  }
  panels: {
    priorities: AssistantPanel
    projectsAttention: AssistantPanel
    reschedulableTasks: AssistantPanel
    meetingsWithoutMinutes: AssistantPanel
    weeklyPlan: AssistantPanel
  }
  questionSuggestions: string[]
  error: string | null
}

const STALE_DAYS = 14
const DONE_STATUSES = ['concluida', 'cancelado', 'concluido', 'arquivado']
const PRIORITY_WEIGHT: Record<string, number> = {
  critica: 0,
  urgente: 0,
  alta: 1,
  media: 2,
  'média': 2,
  baixa: 3,
}

function emptyData(error: string | null = null): AssistantData {
  return {
    todayLabel: new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }),
    summary: {
      todayTasks: 0,
      overdueTasks: 0,
      todayEvents: 0,
      criticalNotStarted: 0,
      staleProjects: 0,
      meetingsWithoutMinutes: 0,
    },
    panels: {
      priorities: panel('priorities', 'Prioridades sugeridas', 'Ordem sugerida por urgencia, prazo e criticidade.', 'Nada urgente agora', 'Quando houver prazo, criticidade ou atraso, o assistente vai destacar aqui.'),
      projectsAttention: panel('projectsAttention', 'Projetos que exigem atencao', 'Projetos parados ou com prazo sensivel.', 'Nenhum projeto em risco', 'Projetos ativos sem movimentacao relevante aparecem aqui.'),
      reschedulableTasks: panel('reschedulableTasks', 'Tarefas que podem ser reagendadas', 'Baixa ou media prioridade que podem sair do caminho.', 'Nada para reagendar', 'Quando houver tarefas flexiveis, elas aparecem como opcao de ajuste.'),
      meetingsWithoutMinutes: panel('meetingsWithoutMinutes', 'Reunioes pendentes de ata', 'Reunioes encerradas sem ata registrada.', 'Nenhuma ata pendente', 'Reunioes passadas sem ata serao listadas aqui.'),
      weeklyPlan: panel('weeklyPlan', 'Sugestao de planejamento semanal', 'Plano simples gerado por regras internas.', 'Sem plano sugerido', 'Inclua tarefas, projetos e agenda para receber uma sugestao semanal.'),
    },
    questionSuggestions: defaultQuestions,
    error,
  }
}

function panel(id: string, title: string, description: string, emptyTitle: string, emptyDescription: string, items: AssistantRecommendation[] = []): AssistantPanel {
  return { id, title, description, emptyTitle, emptyDescription, items }
}

function isOpenTask(task: Task) {
  return !DONE_STATUSES.includes(task.status)
}

function endAt(meeting: Pick<Meeting, 'scheduled_at' | 'duration_minutes'>) {
  return new Date(new Date(meeting.scheduled_at).getTime() + meeting.duration_minutes * 60000).toISOString()
}

function taskHref(task: Task) {
  return `/tasks?highlight=${task.id}`
}

function eventHref(event: CalendarEvent) {
  return `/calendar?highlight=${event.id}`
}

function meetingHref(meeting: Meeting) {
  return `/meetings?highlight=${meeting.id}`
}

function taskRecommendation(task: Task, reason: string, severity: AssistantSeverity): AssistantRecommendation {
  const due = task.due_date ? `Prazo: ${task.due_date}${task.due_time ? ` as ${task.due_time}` : ''}` : 'Sem prazo definido'
  return {
    id: `task-${task.id}-${reason}`,
    title: task.title,
    description: due,
    reason,
    entityType: 'task',
    entityId: task.id,
    href: taskHref(task),
    severity,
    meta: task.priority,
  }
}

function projectRecommendation(project: Project, reason: string, severity: AssistantSeverity): AssistantRecommendation {
  return {
    id: `project-${project.id}-${reason}`,
    title: project.name,
    description: project.due_date ? `Prazo do projeto: ${project.due_date}` : 'Projeto ativo sem prazo definido',
    reason,
    entityType: 'project',
    entityId: project.id,
    href: `/projects/${project.id}`,
    severity,
    meta: project.priority,
  }
}

function meetingRecommendation(meeting: Meeting, reason: string, severity: AssistantSeverity): AssistantRecommendation {
  return {
    id: `meeting-${meeting.id}-${reason}`,
    title: meeting.title,
    description: new Date(meeting.scheduled_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
    reason,
    entityType: 'meeting',
    entityId: meeting.id,
    href: meetingHref(meeting),
    severity,
    meta: meeting.status,
  }
}

function planningRecommendation(id: string, title: string, description: string, reason: string): AssistantRecommendation {
  return {
    id,
    title,
    description,
    reason,
    entityType: 'planning',
    href: '/today',
    severity: 'info',
    meta: 'planejamento',
  }
}

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    const pa = PRIORITY_WEIGHT[a.priority] ?? 9
    const pb = PRIORITY_WEIGHT[b.priority] ?? 9
    if (pa !== pb) return pa - pb
    if (a.due_date && b.due_date && a.due_date !== b.due_date) return a.due_date.localeCompare(b.due_date)
    if (a.due_time && b.due_time) return a.due_time.localeCompare(b.due_time)
    if (a.due_time) return -1
    if (b.due_time) return 1
    return a.created_at.localeCompare(b.created_at)
  })
}

const defaultQuestions = [
  'O que tenho de mais urgente hoje?',
  'Quais tarefas estao vencidas?',
  'Quais projetos estao parados?',
  'Quais reunioes estao sem ata?',
  'O que tenho na agenda de hoje?',
  'Quais tarefas criticas ainda nao foram iniciadas?',
  'O que posso priorizar agora?',
]

export async function getAssistantData(): Promise<AssistantData> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return emptyData()

    const now = new Date()
    const today = todayISO()
    const nowISO = now.toISOString()
    const { start: dayStart, end: dayEnd } = saoPauloDayBoundsUTC(today)
    const staleBefore = new Date(now.getTime() - STALE_DAYS * 86400000).toISOString()

    const [
      tasksResult,
      todayEventsResult,
      projectsResult,
      meetingsResult,
    ] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id).order('due_date', { ascending: true }).limit(120),
      supabase.from('calendar_events').select('*').eq('user_id', user.id).gte('start_at', dayStart).lte('start_at', dayEnd).order('start_at', { ascending: true }),
      supabase.from('projects').select('*').eq('user_id', user.id).neq('status', 'arquivado').order('updated_at', { ascending: true }).limit(80),
      supabase.from('meetings').select('*').eq('user_id', user.id).lte('scheduled_at', nowISO).order('scheduled_at', { ascending: false }).limit(80),
    ])

    if (tasksResult.error || todayEventsResult.error || projectsResult.error || meetingsResult.error) {
      return emptyData('Nao foi possivel carregar a analise do assistente.')
    }

    const tasks = ((tasksResult.data ?? []) as Task[]).filter(isOpenTask)
    const todayTasks = tasks.filter((task) => task.due_date === today)
    const overdueTasks = tasks.filter((task) => task.due_date && task.due_date < today)
    const criticalNotStarted = tasks.filter((task) => task.priority === 'critica' && ['backlog', 'a-fazer', 'pendente', 'nao-iniciada', 'não-iniciada'].includes(task.status))
    const todayEvents = (todayEventsResult.data ?? []) as CalendarEvent[]
    const projects = (projectsResult.data ?? []) as Project[]
    const staleProjects = projects.filter((project) => project.status === 'em-andamento' && project.updated_at < staleBefore)
    const meetings = (meetingsResult.data ?? []) as Meeting[]
    const meetingsWithoutMinutes = meetings.filter((meeting) => !meeting.minutes && endAt(meeting) < nowISO)

    const priorities = [
      ...sortTasks(overdueTasks).slice(0, 4).map((task) => taskRecommendation(task, 'Apareceu porque esta vencida e ainda nao foi concluida.', 'danger')),
      ...sortTasks(criticalNotStarted).slice(0, 4).map((task) => taskRecommendation(task, 'Apareceu porque e critica e ainda nao foi iniciada.', 'danger')),
      ...sortTasks(todayTasks).slice(0, 5).map((task) => taskRecommendation(task, 'Apareceu porque vence hoje.', task.priority === 'alta' || task.priority === 'critica' ? 'warning' : 'info')),
      ...todayEvents.slice(0, 3).map((event) => ({
        id: `event-${event.id}`,
        title: event.title,
        description: new Date(event.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        reason: 'Apareceu porque esta na agenda de hoje.',
        entityType: 'event' as const,
        entityId: event.id,
        href: eventHref(event),
        severity: 'info' as const,
        meta: event.type,
      })),
    ].filter((item, index, array) => array.findIndex((candidate) => candidate.entityType === item.entityType && candidate.entityId === item.entityId) === index).slice(0, 8)

    const reschedulableTasks = sortTasks(tasks)
      .filter((task) => ['baixa', 'media', 'média'].includes(task.priority) && task.due_date && task.due_date <= today && !task.due_time)
      .slice(0, 6)
      .map((task) => taskRecommendation(task, 'Apareceu porque tem prioridade flexivel, prazo apertado e nao possui horario fixo.', 'warning'))

    const projectsAttention = staleProjects.slice(0, 6).map((project) => projectRecommendation(project, `Apareceu porque esta sem movimentacao ha mais de ${STALE_DAYS} dias.`, 'warning'))
    const minutesPanel = meetingsWithoutMinutes.slice(0, 6).map((meeting) => meetingRecommendation(meeting, 'Apareceu porque a reuniao ja terminou e a ata esta vazia.', 'warning'))

    const weeklyPlan = [
      planningRecommendation('week-overdue', 'Segunda: limpar atrasos', `${overdueTasks.length} tarefa(s) vencida(s) para revisar.`, 'Regra: comecar a semana reduzindo risco de prazo.'),
      planningRecommendation('week-focus', 'Terca e quarta: foco nas criticas', `${criticalNotStarted.length} tarefa(s) critica(s) ainda nao iniciada(s).`, 'Regra: reservar blocos de foco para trabalho de maior impacto.'),
      planningRecommendation('week-projects', 'Quinta: destravar projetos', `${staleProjects.length} projeto(s) parado(s) pedem proxima acao.`, 'Regra: projetos sem movimento precisam de decisao ou tarefa vinculada.'),
      planningRecommendation('week-meetings', 'Sexta: fechar atas e proximos passos', `${meetingsWithoutMinutes.length} reuniao(oes) pendente(s) de ata.`, 'Regra: fechar registros antes da proxima semana evita perda de contexto.'),
    ].filter((item) => !item.description.startsWith('0 '))

    return {
      todayLabel: now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }),
      summary: {
        todayTasks: todayTasks.length,
        overdueTasks: overdueTasks.length,
        todayEvents: todayEvents.length,
        criticalNotStarted: criticalNotStarted.length,
        staleProjects: staleProjects.length,
        meetingsWithoutMinutes: meetingsWithoutMinutes.length,
      },
      panels: {
        priorities: panel('priorities', 'Prioridades sugeridas', 'Ordem sugerida por urgencia, prazo e criticidade.', 'Nada urgente agora', 'Quando houver prazo, criticidade ou atraso, o assistente vai destacar aqui.', priorities),
        projectsAttention: panel('projectsAttention', 'Projetos que exigem atencao', 'Projetos parados ou com prazo sensivel.', 'Nenhum projeto em risco', 'Projetos ativos sem movimentacao relevante aparecem aqui.', projectsAttention),
        reschedulableTasks: panel('reschedulableTasks', 'Tarefas que podem ser reagendadas', 'Baixa ou media prioridade que podem sair do caminho.', 'Nada para reagendar', 'Quando houver tarefas flexiveis, elas aparecem como opcao de ajuste.', reschedulableTasks),
        meetingsWithoutMinutes: panel('meetingsWithoutMinutes', 'Reunioes pendentes de ata', 'Reunioes encerradas sem ata registrada.', 'Nenhuma ata pendente', 'Reunioes passadas sem ata serao listadas aqui.', minutesPanel),
        weeklyPlan: panel('weeklyPlan', 'Sugestao de planejamento semanal', 'Plano simples gerado por regras internas.', 'Sem plano sugerido', 'Inclua tarefas, projetos e agenda para receber uma sugestao semanal.', weeklyPlan),
      },
      questionSuggestions: defaultQuestions,
      error: null,
    }
  } catch {
    return emptyData('Nao foi possivel carregar o assistente.')
  }
}
