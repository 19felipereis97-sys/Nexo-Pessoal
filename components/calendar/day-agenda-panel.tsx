'use client'

import { Clock, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { CalendarEvent } from '@/lib/supabase/types'
import { EVENT_TYPE_COLOR, EVENT_TYPE_LABEL } from './constants'

interface DayAgendaPanelProps {
  events: CalendarEvent[]
  selectedDate: Date
  onEventClick: (event: CalendarEvent) => void
  onAddEvent: () => void
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function durationLabel(start: string, end: string): string {
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  if (mins < 60) return `${mins}min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h${m}` : `${h}h`
}

export function DayAgendaPanel({ events, selectedDate, onEventClick, onAddEvent }: DayAgendaPanelProps) {
  const dateStr = localDateKey(selectedDate)
  const isToday = dateStr === localDateKey(new Date())

  const dayEvents = events
    .filter((e) => {
      const d = localDateKey(new Date(e.start_at))
      return d === dateStr
    })
    .sort((a, b) => a.start_at.localeCompare(b.start_at))

  const dayLabel = isToday
    ? 'Hoje'
    : selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })

  return (
    <div className="flex h-full flex-col rounded-xl border border-[#1f1f1f] bg-[#080808]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1f1f1f] px-4 py-3 shrink-0">
        <div>
          <p className={cn('text-sm font-semibold', isToday ? 'text-[#c9a227]' : 'text-[#e5e5e5]')}>
            {dayLabel}
          </p>
          {!isToday && (
            <p className="text-xs text-[#525252] capitalize">
              {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onAddEvent}
          className="flex h-6 w-6 items-center justify-center rounded-md text-[#525252] hover:bg-[#1a1a1a] hover:text-[#c9a227] transition-colors"
          aria-label="Adicionar compromisso"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Events */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {dayEvents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111111]">
              <Clock className="h-5 w-5 text-[#333]" />
            </div>
            <p className="text-xs text-[#333]">Nenhum compromisso</p>
            <Button variant="ghost" size="sm" onClick={onAddEvent} className="text-[#525252]">
              <Plus className="h-3.5 w-3.5" />
              Adicionar
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {dayEvents.map((event) => {
              const color = EVENT_TYPE_COLOR[event.type] ?? '#525252'
              const typeLabel = EVENT_TYPE_LABEL[event.type] ?? event.type
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onEventClick(event)}
                  className="group flex w-full items-start gap-2.5 rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] p-2.5 text-left hover:border-[#333] hover:bg-[#111111] transition-all"
                >
                  <div
                    className="mt-0.5 h-full w-0.5 self-stretch rounded-full shrink-0"
                    style={{ backgroundColor: color, minHeight: '32px' }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-[#e5e5e5]">{event.title}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] text-[#525252]">{fmt(event.start_at)} – {fmt(event.end_at)}</span>
                      <span className="text-[10px] text-[#333]">·</span>
                      <span className="text-[10px] text-[#525252]">{durationLabel(event.start_at, event.end_at)}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-[#333]">{typeLabel}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer count */}
      {dayEvents.length > 0 && (
        <div className="border-t border-[#111111] px-4 py-2 shrink-0">
          <p className="text-[10px] text-[#333]">
            {dayEvents.length} compromisso{dayEvents.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}
