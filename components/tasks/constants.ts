export type TaskStatus = 'backlog' | 'a-fazer' | 'em-andamento' | 'aguardando' | 'concluida'
export type TaskPriority = 'baixa' | 'média' | 'alta' | 'critica'
export type SortBy = 'due_date' | 'priority' | 'created_at'
export type ViewType = 'kanban' | 'lista' | 'hoje' | 'semana' | 'atrasadas' | 'concluidas'

export const TASK_STATUSES: TaskStatus[] = ['backlog', 'a-fazer', 'em-andamento', 'aguardando', 'concluida']
export const TASK_PRIORITIES: TaskPriority[] = ['baixa', 'média', 'alta', 'critica']

export const STATUS_LABEL: Record<TaskStatus, string> = {
  'backlog': 'Backlog',
  'a-fazer': 'A fazer',
  'em-andamento': 'Em andamento',
  'aguardando': 'Aguardando',
  'concluida': 'Concluída',
}

export const STATUS_BADGE: Record<TaskStatus, string> = {
  'backlog': 'bg-[#262626] text-[#737373] border border-[#333]',
  'a-fazer': 'bg-[#1d4ed8]/10 text-[#60a5fa] border border-[#1d4ed8]/20',
  'em-andamento': 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20',
  'aguardando': 'bg-[#8b5cf6]/10 text-[#a78bfa] border border-[#8b5cf6]/20',
  'concluida': 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20',
}

export const STATUS_DOT: Record<TaskStatus, string> = {
  'backlog': 'bg-[#525252]',
  'a-fazer': 'bg-[#60a5fa]',
  'em-andamento': 'bg-[#f59e0b]',
  'aguardando': 'bg-[#a78bfa]',
  'concluida': 'bg-[#22c55e]',
}

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  'baixa': 'Baixa',
  'média': 'Média',
  'alta': 'Alta',
  'critica': 'Crítica',
}

export const PRIORITY_ORDER: Record<string, number> = {
  'critica': 0,
  'alta': 1,
  'média': 2,
  'baixa': 3,
  'urgente': 0,
}

export const PRIORITY_BADGE: Record<string, string> = {
  'baixa': 'bg-[#1a1a1a] text-[#525252] border border-[#262626]',
  'média': 'bg-[#eab308]/10 text-[#eab308] border border-[#eab308]/20',
  'alta': 'bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20',
  'critica': 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20',
  'urgente': 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20',
}

export const PRIORITY_DOT: Record<string, string> = {
  'baixa': 'bg-[#525252]',
  'média': 'bg-[#eab308]',
  'alta': 'bg-[#f97316]',
  'critica': 'bg-[#ef4444]',
  'urgente': 'bg-[#ef4444]',
}

export const VIEWS: { id: ViewType; label: string }[] = [
  { id: 'kanban', label: 'Kanban' },
  { id: 'lista', label: 'Lista' },
  { id: 'hoje', label: 'Hoje' },
  { id: 'semana', label: 'Semana' },
  { id: 'atrasadas', label: 'Atrasadas' },
  { id: 'concluidas', label: 'Concluídas' },
]
