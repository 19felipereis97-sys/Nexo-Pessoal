export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'muted'

export const PRIORITY_ORDER: Record<string, number> = {
  urgente: 0,
  alta: 1,
  média: 2,
  baixa: 3,
}

export const PRIORITY_BADGE: Record<string, BadgeVariant> = {
  urgente: 'danger',
  alta: 'danger',
  média: 'warning',
  baixa: 'muted',
}

export const PRIORITY_DOT: Record<string, string> = {
  urgente: 'bg-[#ef4444]',
  alta: 'bg-[#f97316]',
  média: 'bg-[#eab308]',
  baixa: 'bg-[#525252]',
}

export const PRIORITY_LABEL: Record<string, string> = {
  urgente: 'Urgente — ação imediata',
  alta: 'Alta — fazer hoje',
  média: 'Média — importante',
  baixa: 'Baixa — pode aguardar',
}

export const TASK_STATUS_LABEL: Record<string, string> = {
  backlog: 'A fazer',
  'em andamento': 'Em andamento',
  revisão: 'Em revisão',
  concluído: 'Concluído',
  cancelado: 'Cancelado',
}

export const TASK_STATUS_ORDER = ['em andamento', 'revisão', 'backlog']

export const MEETING_STATUS_BADGE: Record<string, BadgeVariant> = {
  agendada: 'accent',
  realizada: 'success',
  cancelada: 'danger',
  adiada: 'muted',
  reagendada: 'warning',
}

export const EVENT_TYPE_BADGE: Record<string, BadgeVariant> = {
  reunião: 'accent',
  externo: 'warning',
  compromisso: 'warning',
  lembrete: 'muted',
  evento: 'muted',
  tarefa: 'muted',
  bloqueio: 'danger',
}
