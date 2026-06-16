'use client'

import { CalendarClock, Plus } from 'lucide-react'
import { PremiumTooltip } from '@/components/ui/premium-tooltip'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/utils/date'
import type { CalendarEvent } from '@/lib/supabase/types'

interface UpcomingCommitmentsPanelProps {
  events: CalendarEvent[]
  onSelect: (e: CalendarEvent) => void
  onCreate: () => void
}

function dayLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return 'Hoje'
  if (d.toDateString() === tomorrow.toDateString()) return 'Amanhã'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function UpcomingCommitmentsPanel({ events, onSelect, onCreate }: UpcomingCommitmentsPanelProps) {
  return (
    <div className="nexo-surface nexo-rail-card rounded-xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-[#c9a227]" />
        <h2 className="text-sm font-semibold text-[#f5f5f5]">Próximos compromissos</h2>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-5 text-center">
          <p className="text-xs text-[#737373]">Nada agendado a seguir.</p>
          <Button variant="secondary" size="sm" onClick={onCreate}>
            <Plus className="h-3.5 w-3.5" />
            Adicionar compromisso
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {events.map((event) => (
            <li key={event.id}>
              <PremiumTooltip
                side="left"
                title={event.title}
                content={`${dayLabel(event.start_at)} às ${formatTime(event.start_at)}${event.location ? ` · ${event.location}` : ''}`}
                className="w-full"
              >
                <button
                  onClick={() => onSelect(event)}
                  className="nexo-hover flex w-full items-center gap-3 rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-3 py-2 text-left"
                >
                  <div className="flex w-12 shrink-0 flex-col">
                    <span className="text-[10px] font-medium uppercase text-[#737373]">{dayLabel(event.start_at)}</span>
                    <span className="text-xs font-semibold text-[#c9a227]">{formatTime(event.start_at)}</span>
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm text-[#f5f5f5]">{event.title}</span>
                </button>
              </PremiumTooltip>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
