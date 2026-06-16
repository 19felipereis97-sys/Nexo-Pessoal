export type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'

export const EVENT_TYPES = [
  'compromisso',
  'reunião',
  'prazo',
  'foco',
  'pessoal',
  'trabalho',
  'estudo',
] as const

export type EventType = (typeof EVENT_TYPES)[number]

export const EVENT_TYPE_LABEL: Record<string, string> = {
  compromisso: 'Compromisso',
  reunião: 'Reunião',
  prazo: 'Prazo',
  foco: 'Bloco de foco',
  pessoal: 'Pessoal',
  trabalho: 'Trabalho',
  estudo: 'Estudo',
}

/** Solid bg used in FullCalendar */
export const EVENT_TYPE_COLOR: Record<string, string> = {
  compromisso: '#2563eb',
  reunião:     '#7c3aed',
  prazo:       '#dc2626',
  foco:        '#d97706',
  pessoal:     '#db2777',
  trabalho:    '#4f46e5',
  estudo:      '#16a34a',
}

/** Lighter bg used in badges / pills */
export const EVENT_TYPE_BADGE: Record<string, string> = {
  compromisso: 'bg-[#2563eb]/10 text-[#60a5fa] border border-[#2563eb]/20',
  reunião:     'bg-[#7c3aed]/10 text-[#a78bfa] border border-[#7c3aed]/20',
  prazo:       'bg-[#dc2626]/10 text-[#f87171] border border-[#dc2626]/20',
  foco:        'bg-[#d97706]/10 text-[#fbbf24] border border-[#d97706]/20',
  pessoal:     'bg-[#db2777]/10 text-[#f472b6] border border-[#db2777]/20',
  trabalho:    'bg-[#4f46e5]/10 text-[#818cf8] border border-[#4f46e5]/20',
  estudo:      'bg-[#16a34a]/10 text-[#4ade80] border border-[#16a34a]/20',
}

export const VIEW_LABEL: Record<CalendarView, string> = {
  dayGridMonth: 'Mês',
  timeGridWeek: 'Semana',
  timeGridDay:  'Dia',
}

export const VIEWS: CalendarView[] = ['dayGridMonth', 'timeGridWeek', 'timeGridDay']
