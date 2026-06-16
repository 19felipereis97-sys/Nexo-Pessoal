'use client'

import { MapPin, Clock, Calendar } from 'lucide-react'
import { Drawer } from '@/components/ui/drawer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatTimeRange, eventDurationMin } from '@/lib/utils/date'
import type { CalendarEvent } from '@/lib/supabase/types'

interface EventDrawerProps {
  event: CalendarEvent | null
  onClose: () => void
}

const typeConfig: Record<string, { label: string; variant: 'accent' | 'muted' | 'warning' | 'danger' }> = {
  reunião: { label: 'Reunião', variant: 'accent' },
  compromisso: { label: 'Compromisso', variant: 'warning' },
  lembrete: { label: 'Lembrete', variant: 'muted' },
  evento: { label: 'Evento', variant: 'muted' },
  bloqueio: { label: 'Bloqueio', variant: 'danger' },
}

export function EventDrawer({ event, onClose }: EventDrawerProps) {
  if (!event) return null

  const type = typeConfig[event.type] ?? typeConfig['evento']
  const duration = eventDurationMin(event.start_at, event.end_at)
  const durationLabel = duration >= 60
    ? `${Math.floor(duration / 60)}h${duration % 60 > 0 ? `${duration % 60}min` : ''}`
    : `${duration}min`

  const startDate = new Date(event.start_at)
  const dateStr = startDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <Drawer open={!!event} onClose={onClose} title="Detalhes do evento" width="w-full sm:w-[400px]">
      <div className="flex flex-col gap-5">
        {/* Título */}
        <div>
          <h3 className="text-base font-semibold text-[#f5f5f5] leading-snug">{event.title}</h3>
        </div>

        {/* Metadados */}
        <div className="flex flex-col gap-0">
          <div className="flex items-center justify-between py-2.5 border-b border-[#1a1a1a]">
            <span className="text-xs text-[#737373]">Tipo</span>
            <Badge variant={type.variant}>{type.label}</Badge>
          </div>

          <div className="flex items-start justify-between py-2.5 border-b border-[#1a1a1a]">
            <span className="text-xs text-[#737373] flex items-center gap-1.5 mt-0.5">
              <Calendar className="h-3.5 w-3.5" />
              Data
            </span>
            <span className="text-xs font-medium text-[#f5f5f5] text-right capitalize">{dateStr}</span>
          </div>

          <div className="flex items-center justify-between py-2.5 border-b border-[#1a1a1a]">
            <span className="text-xs text-[#737373] flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Horário
            </span>
            <span className="text-xs font-medium text-[#f5f5f5]">
              {formatTimeRange(event.start_at, event.end_at)}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5 border-b border-[#1a1a1a]">
            <span className="text-xs text-[#737373]">Duração</span>
            <span className="text-xs text-[#a3a3a3]">{durationLabel}</span>
          </div>

          {event.location && (
            <div className="flex items-start justify-between py-2.5 border-b border-[#1a1a1a]">
              <span className="text-xs text-[#737373] flex items-center gap-1.5 mt-0.5">
                <MapPin className="h-3.5 w-3.5" />
                Local
              </span>
              <span className="text-xs text-[#a3a3a3] text-right max-w-[200px]">{event.location}</span>
            </div>
          )}
        </div>

        {/* Descrição */}
        {event.description && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-[#737373]">Descrição</p>
            <p className="text-sm text-[#a3a3a3] leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {!event.description && (
          <p className="text-xs text-[#737373] italic">Sem descrição.</p>
        )}

        {/* Ações */}
        <div className="pt-2 border-t border-[#262626]">
          <Button variant="ghost" className="w-full text-[#737373]" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Drawer>
  )
}
