export function formatTime(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`
}

export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatDateShort(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function todayISO(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}`
}

export function greetingByHour(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function fullWeekday(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function daysOverdue(dueDateStr: string): number {
  const [y, m, d] = dueDateStr.split('-').map(Number)
  const due = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - due.getTime()) / 86400000)
}

export function eventDurationMin(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
}

export function weekBoundsSP(): { weekStart: string; weekEnd: string } {
  const today = todayISO()
  const d = new Date(`${today}T12:00:00Z`)
  const dow = d.getUTCDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const diffToMonday = dow === 0 ? -6 : 1 - dow
  const monday = new Date(d.getTime() + diffToMonday * 86400000)
  const sunday = new Date(monday.getTime() + 6 * 86400000)
  return {
    weekStart: monday.toISOString().slice(0, 10),
    weekEnd: sunday.toISOString().slice(0, 10),
  }
}

export function addDaysISO(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`)
  return new Date(d.getTime() + days * 86400000).toISOString().slice(0, 10)
}

export function monthBoundsSP(): { monthStart: string; monthEnd: string } {
  const today = todayISO()
  const [y, m] = today.split('-').map(Number)
  const firstDay = `${y}-${String(m).padStart(2, '0')}-01`
  const lastDayNum = new Date(y, m, 0).getDate()
  const lastDay = `${y}-${String(m).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`
  return { monthStart: firstDay, monthEnd: lastDay }
}

export function addMonthsISO(dateStr: string, months: number): string {
  const [y, m] = dateStr.split('-').map(Number)
  const newDate = new Date(y, m - 1 + months, 1)
  return `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-01`
}

export function monthEndISO(monthStartStr: string): string {
  const [y, m] = monthStartStr.split('-').map(Number)
  const lastDayNum = new Date(y, m, 0).getDate()
  return `${y}-${String(m).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`
}

export function saoPauloDayBoundsUTC(dateStr: string): { start: string; end: string } {
  const ref = new Date(`${dateStr}T12:00:00Z`)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(ref)
  const sp = Object.fromEntries(parts.map((p) => [p.type, p.value]))
  const localMs = new Date(`${sp.year}-${sp.month}-${sp.day}T${sp.hour}:${sp.minute}:${sp.second}Z`).getTime()
  const offsetMs = localMs - ref.getTime()
  const midnight = new Date(`${dateStr}T00:00:00Z`).getTime()
  const startMs = midnight - offsetMs
  return {
    start: new Date(startMs).toISOString(),
    end: new Date(startMs + 86400000 - 1).toISOString(),
  }
}
