'use client'

import { CalendarDays, Clock, MapPin, Plus } from 'lucide-react'
import { DashboardSectionCard } from './dashboard-section-card'
import { EmptyActionState } from './empty-action-state'
import { PremiumTooltip } from '@/components/ui/premium-tooltip'
import { EVENT_TYPE_BADGE } from './constants'
import { Badge } from '@/components/ui/badge'
import { formatTime, formatTimeRange, eventDurationMin } from '@/lib/utils/date'
import type { CalendarEvent } from '@/lib/supabase/types'

interface TodayAgendaPanelProps {
  events: CalendarEvent[]
  onSelect: (e: CalendarEvent) => void
  onCreate: () => void
}

function durationLabel(min: number): string {
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}h${m > 0 ? `${m}min` : ''}`
}

export function TodayAgendaPanel({ events, onSelect, onCreate }: TodayAgendaPanelProps) {
  return (
    <DashboardSectionCard icon={CalendarDays} title="Agenda de hoje" count={events.length}>
      {events.length === 0 ? (
        <EmptyActionState
          icon={CalendarDays}
          title="Sem compromissos hoje"
          description="Sua agenda está livre. Que tal bloquear um horário de foco?"
          action={{ label: 'Adicionar compromisso', onClick: onCreate, icon: Plus }}
        />
      ) : (
        <ul className="flex flex-col px-5 py-4">
          {events.map((event, i) => {
            const dur = eventDurationMin(event.start_at, event.end_at)
            const isLast = i === events.length - 1
            return (
              <li key={event.id} className="flex gap-3">
                {/* timeline rail */}
                <div className="flex w-12 shrink-0 flex-col items-end pt-0.5">
                  <span className="text-xs font-medium text-[#a3a3a3]">{formatTime(event.start_at)}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[#c9a227] bg-[#0a0a0a]" />
                  {!isLast && <span className="my-1 w-px flex-1 bg-[#1a1a1a]" />}
                </div>

                <PremiumTooltip
                  side="left"
                  title={event.title}
                  content={
                    <span>
                      {formatTimeRange(event.start_at, event.end_at)} · {durationLabel(dur)}
                      {event.location ? <><br />{event.location}</> : null}
                      {event.description ? <><br /><span className="text-[#737373]">{event.description}</span></> : null}
                    </span>
                  }
                  className={`min-w-0 flex-1 ${isLast ? '' : 'pb-4'}`}
                >
                  <button
                    onClick={() => onSelect(event)}
                    className="nexo-hover group w-full rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] p-3 text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-medium text-[#f5f5f5]">{event.title}</p>
                      <Badge variant={EVENT_TYPE_BADGE[event.type] ?? 'muted'} className="shrink-0 text-[10px]">
                        {event.type}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[#737373]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeRange(event.start_at, event.end_at)}
                      </span>
                      <span>{durationLabel(dur)}</span>
                    </div>
                    {event.location && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-[#525252]">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{event.location}</span>
                      </p>
                    )}
                  </button>
                </PremiumTooltip>
              </li>
            )
          })}
        </ul>
      )}
    </DashboardSectionCard>
  )
}
