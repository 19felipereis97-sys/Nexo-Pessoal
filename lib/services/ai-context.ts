import { createClient } from '@/lib/supabase/server'
import { todayISO, saoPauloDayBoundsUTC } from '@/lib/utils/date'

export interface AIContextData {
  today: string
  todayTasks: Array<{ title: string; priority: string; due_time: string | null; status: string }>
  overdueTasks: Array<{ title: string; priority: string; due_date: string }>
  criticalTasks: Array<{ title: string; status: string; due_date: string | null }>
  todayEvents: Array<{ title: string; start_at: string; end_at: string | null; type: string | null }>
  activeProjects: Array<{ name: string; status: string; progress: number; due_date: string | null; last_updated: string }>
  pendingMeetingsWithoutMinutes: Array<{ title: string; scheduled_at: string }>
  recentNotes: Array<{ title: string; type: string }>
}

const DONE = ['concluida', 'cancelado', 'concluido', 'arquivado']

export async function buildAIContext(): Promise<AIContextData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const today = todayISO()
  const nowISO = new Date().toISOString()
  const { start: dayStart, end: dayEnd } = saoPauloDayBoundsUTC(today)

  const [tasksRes, eventsRes, projectsRes, meetingsRes, notesRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('title,status,priority,due_date,due_time')
      .eq('user_id', user.id)
      .not('status', 'in', `(${DONE.map((s) => `"${s}"`).join(',')})`)
      .order('due_date', { ascending: true })
      .limit(60),
    supabase
      .from('calendar_events')
      .select('title,start_at,end_at,type')
      .eq('user_id', user.id)
      .gte('start_at', dayStart)
      .lte('start_at', dayEnd)
      .order('start_at')
      .limit(15),
    supabase
      .from('projects')
      .select('name,status,progress,due_date,updated_at')
      .eq('user_id', user.id)
      .eq('status', 'em-andamento')
      .order('updated_at', { ascending: true })
      .limit(20),
    supabase
      .from('meetings')
      .select('title,scheduled_at,status,minutes')
      .eq('user_id', user.id)
      .lte('scheduled_at', nowISO)
      .order('scheduled_at', { ascending: false })
      .limit(20),
    supabase
      .from('notes')
      .select('title,type')
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const tasks = tasksRes.data ?? []
  const todayTasks = tasks
    .filter((t) => t.due_date === today)
    .slice(0, 15)
    .map((t) => ({ title: t.title, priority: t.priority, due_time: t.due_time, status: t.status }))

  const overdueTasks = tasks
    .filter((t) => t.due_date && t.due_date < today)
    .slice(0, 10)
    .map((t) => ({ title: t.title, priority: t.priority, due_date: t.due_date as string }))

  const criticalTasks = tasks
    .filter((t) => ['critica', 'urgente'].includes(t.priority) && t.due_date !== today)
    .slice(0, 8)
    .map((t) => ({ title: t.title, status: t.status, due_date: t.due_date }))

  const todayEvents = (eventsRes.data ?? []).map((e) => ({
    title: e.title,
    start_at: e.start_at,
    end_at: e.end_at,
    type: e.type,
  }))

  const activeProjects = (projectsRes.data ?? []).map((p) => ({
    name: p.name,
    status: p.status,
    progress: p.progress,
    due_date: p.due_date,
    last_updated: p.updated_at,
  }))

  const pendingMeetingsWithoutMinutes = (meetingsRes.data ?? [])
    .filter((m) => !m.minutes)
    .slice(0, 5)
    .map((m) => ({ title: m.title, scheduled_at: m.scheduled_at }))

  const recentNotes = (notesRes.data ?? []).map((n) => ({ title: n.title, type: n.type }))

  return {
    today,
    todayTasks,
    overdueTasks,
    criticalTasks,
    todayEvents,
    activeProjects,
    pendingMeetingsWithoutMinutes,
    recentNotes,
  }
}

export function formatContextForPrompt(ctx: AIContextData): string {
  const lines: string[] = [`=== DADOS DO NEXO PESSOAL (${ctx.today}) ===\n`]

  if (ctx.todayTasks.length) {
    lines.push(`TAREFAS PARA HOJE (${ctx.todayTasks.length}):`)
    ctx.todayTasks.forEach((t) =>
      lines.push(
        `  - [${t.priority.toUpperCase()}] ${t.title}${t.due_time ? ` às ${t.due_time.slice(0, 5)}` : ''} (${t.status})`,
      ),
    )
    lines.push('')
  } else {
    lines.push('TAREFAS PARA HOJE: nenhuma\n')
  }

  if (ctx.overdueTasks.length) {
    lines.push(`TAREFAS VENCIDAS (${ctx.overdueTasks.length}):`)
    ctx.overdueTasks.forEach((t) =>
      lines.push(`  - [${t.priority.toUpperCase()}] ${t.title} (venceu em ${t.due_date})`),
    )
    lines.push('')
  }

  if (ctx.criticalTasks.length) {
    lines.push(`TAREFAS CRÍTICAS/URGENTES (${ctx.criticalTasks.length}):`)
    ctx.criticalTasks.forEach((t) =>
      lines.push(`  - ${t.title} (${t.status}${t.due_date ? `, prazo: ${t.due_date}` : ''})`),
    )
    lines.push('')
  }

  if (ctx.todayEvents.length) {
    lines.push(`AGENDA DE HOJE (${ctx.todayEvents.length}):`)
    ctx.todayEvents.forEach((e) => {
      const time = new Date(e.start_at).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      })
      lines.push(`  - ${time} ${e.title}${e.type ? ` [${e.type}]` : ''}`)
    })
    lines.push('')
  } else {
    lines.push('AGENDA DE HOJE: sem compromissos\n')
  }

  if (ctx.activeProjects.length) {
    lines.push(`PROJETOS ATIVOS (${ctx.activeProjects.length}):`)
    ctx.activeProjects.forEach((p) =>
      lines.push(
        `  - ${p.name} ${p.progress}%${p.due_date ? ` prazo: ${p.due_date}` : ''} (atualizado: ${p.last_updated.slice(0, 10)})`,
      ),
    )
    lines.push('')
  }

  if (ctx.pendingMeetingsWithoutMinutes.length) {
    lines.push(`REUNIÕES SEM ATA (${ctx.pendingMeetingsWithoutMinutes.length}):`)
    ctx.pendingMeetingsWithoutMinutes.forEach((m) =>
      lines.push(
        `  - ${m.title} (realizada em ${new Date(m.scheduled_at).toLocaleDateString('pt-BR')})`,
      ),
    )
    lines.push('')
  }

  if (ctx.recentNotes.length) {
    lines.push(`NOTAS RECENTES (${ctx.recentNotes.length}):`)
    ctx.recentNotes.forEach((n) => lines.push(`  - [${n.type}] ${n.title}`))
    lines.push('')
  }

  return lines.join('\n')
}
