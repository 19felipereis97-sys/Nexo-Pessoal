import type { Routine, RoutineLog } from '@/lib/supabase/types'

const DOW_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export function isRoutineForDay(routine: Routine, dateStr: string): boolean {
  if (routine.status !== 'active') return false
  const d = new Date(`${dateStr}T12:00:00Z`)
  const dow = d.getUTCDay()

  switch (routine.frequency) {
    case 'diaria':
      return true
    case 'semanal':
    case 'personalizada':
      return routine.days_of_week?.includes(DOW_NAMES[dow]) ?? false
    case 'mensal': {
      const dayOfMonth = parseInt(dateStr.split('-')[2])
      return routine.days_of_week?.includes(String(dayOfMonth)) ?? false
    }
    default:
      return false
  }
}

export function calcStreak(routine: Routine, logs: RoutineLog[], today: string): number {
  const logDates = new Set(logs.filter((l) => l.routine_id === routine.id).map((l) => l.reference_date))
  let streak = 0
  // Start from yesterday and go back 90 days; today only counts if already completed
  const startOffset = logDates.has(today) ? 0 : -1
  for (let i = startOffset; i >= -90; i--) {
    const d = new Date(`${today}T12:00:00Z`)
    const dateMs = d.getTime() + i * 86400000
    const dateStr = new Date(dateMs).toISOString().slice(0, 10)
    if (!isRoutineForDay(routine, dateStr)) continue
    if (logDates.has(dateStr)) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export function isOverdue(routine: Routine, logs: RoutineLog[], today: string): boolean {
  // Find the most recent scheduled day before today
  for (let i = 1; i <= 7; i++) {
    const d = new Date(`${today}T12:00:00Z`)
    const dateMs = d.getTime() - i * 86400000
    const dateStr = new Date(dateMs).toISOString().slice(0, 10)
    if (isRoutineForDay(routine, dateStr)) {
      return !logs.some((l) => l.routine_id === routine.id && l.reference_date === dateStr)
    }
  }
  return false
}

export const AREA_LABELS: Record<string, string> = {
  trabalho: 'Trabalho',
  estudos: 'Estudos',
  saude: 'Saúde',
  financeiro: 'Financeiro',
  pessoal: 'Pessoal',
  conteudo: 'Conteúdo',
  mudanca: 'Mudança',
  organizacao: 'Organização',
  projetos: 'Projetos',
}

export const FREQUENCY_LABELS: Record<string, string> = {
  diaria: 'Diária',
  semanal: 'Semanal',
  mensal: 'Mensal',
  personalizada: 'Personalizada',
}

export const DAY_OPTIONS = [
  { value: 'monday', label: 'Seg' },
  { value: 'tuesday', label: 'Ter' },
  { value: 'wednesday', label: 'Qua' },
  { value: 'thursday', label: 'Qui' },
  { value: 'friday', label: 'Sex' },
  { value: 'saturday', label: 'Sáb' },
  { value: 'sunday', label: 'Dom' },
]
