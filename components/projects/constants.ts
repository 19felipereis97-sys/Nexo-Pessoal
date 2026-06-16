export const PROJECT_STATUSES = ['planejado', 'em-andamento', 'aguardando', 'pausado', 'concluido', 'arquivado'] as const
export const PROJECT_PRIORITIES = ['baixa', 'média', 'alta', 'critica'] as const

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  planejado: 'Planejado',
  'em-andamento': 'Em andamento',
  aguardando: 'Aguardando',
  pausado: 'Pausado',
  concluido: 'Concluído',
  arquivado: 'Arquivado',
}

export const PROJECT_PRIORITY_LABEL: Record<string, string> = {
  baixa: 'Baixa',
  média: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
}

export const PROJECT_STATUS_VARIANT: Record<string, 'muted' | 'accent' | 'warning' | 'success'> = {
  planejado: 'muted',
  'em-andamento': 'accent',
  aguardando: 'warning',
  pausado: 'warning',
  concluido: 'success',
  arquivado: 'muted',
}
