export const MEETING_STATUSES = ['agendada', 'realizada', 'cancelada', 'reagendada'] as const
export const MEETING_STATUS_LABEL: Record<string, string> = {
  agendada: 'Agendada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  reagendada: 'Reagendada',
}
export const MEETING_STATUS_VARIANT: Record<string, 'accent' | 'success' | 'danger' | 'warning'> = {
  agendada: 'accent',
  realizada: 'success',
  cancelada: 'danger',
  reagendada: 'warning',
}
export const MEETING_STATUS_TOOLTIP: Record<string, string> = {
  agendada: 'Reunião confirmada e presente na agenda.',
  realizada: 'Reunião concluída; registre ata, decisões e próximos passos.',
  cancelada: 'Reunião cancelada.',
  reagendada: 'Data ou horário foram alterados.',
}
