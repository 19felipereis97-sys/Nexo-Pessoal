'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type ViewMode = 'mês' | 'semana' | 'dia'

interface MiniCalendarPanelProps {
  /** Set of YYYY-MM-DD strings that have activity */
  activityDays: Set<string>
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function MiniCalendarPanel({ activityDays }: MiniCalendarPanelProps) {
  const [view, setView] = useState<ViewMode>('mês')
  const today = useMemo(() => new Date(), [])

  const { cells, monthLabel, todayKey, weekStart, weekEnd } = useMemo(() => {
    const year = today.getFullYear()
    const month = today.getMonth()
    const first = new Date(year, month, 1)
    const startWeekday = first.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const list: (Date | null)[] = []
    for (let i = 0; i < startWeekday; i++) list.push(null)
    for (let d = 1; d <= daysInMonth; d++) list.push(new Date(year, month, d))
    while (list.length % 7 !== 0) list.push(null)

    // current week range (Sun..Sat) for the "semana" highlight
    const ws = new Date(today)
    ws.setDate(today.getDate() - today.getDay())
    ws.setHours(0, 0, 0, 0)
    const we = new Date(ws)
    we.setDate(ws.getDate() + 6)

    return {
      cells: list,
      monthLabel: first.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      todayKey: toKey(today),
      weekStart: ws,
      weekEnd: we,
    }
  }, [today])

  return (
    <div className="nexo-surface nexo-rail-card rounded-xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold capitalize text-[#f5f5f5]">{monthLabel}</p>
        <div className="flex items-center gap-0.5 rounded-lg border border-[#262626] bg-[#0d0d0d] p-0.5">
          {(['mês', 'semana', 'dia'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'rounded-md px-2 py-1 text-[10px] font-medium capitalize transition-colors',
                view === v ? 'bg-[#c9a227]/15 text-[#c9a227]' : 'text-[#737373] hover:text-[#a3a3a3]',
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="text-center text-[10px] font-medium text-[#525252]">{w}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <span key={i} />
          const key = toKey(date)
          const isToday = key === todayKey
          const hasActivity = activityDays.has(key)
          const inWeek = date >= weekStart && date <= weekEnd
          const emphasized =
            view === 'dia' ? isToday : view === 'semana' ? inWeek : true

          return (
            <Link
              key={i}
              href="/calendar"
              className={cn(
                'relative flex aspect-square items-center justify-center rounded-md text-xs transition-colors',
                isToday
                  ? 'bg-[#c9a227] font-semibold text-[#050505]'
                  : emphasized
                    ? 'text-[#d4d4d4] hover:bg-[#1a1a1a]'
                    : 'text-[#525252] hover:bg-[#141414]',
              )}
            >
              {date.getDate()}
              {hasActivity && !isToday && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#c9a227]" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
