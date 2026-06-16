'use client'

import { useState } from 'react'
import { X, Edit2, Trash2, MapPin, Clock, Calendar, FolderOpen, AlignLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { CalendarEvent } from '@/lib/supabase/types'
import { EVENT_TYPE_LABEL, EVENT_TYPE_BADGE, EVENT_TYPE_COLOR } from './constants'

interface EventDetailDrawerProps {
  event: CalendarEvent | null
  projectMap: Record<string, string>
  onClose: () => void
  onEdit: (event: CalendarEvent) => void
  onDelete: (eventId: string) => void
}

function formatDateFull(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatTimePair(start: string, end: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${fmt(start)} – ${fmt(end)}`
}

function durationLabel(start: string, end: string): string {
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export function EventDetailDrawer({
  event,
  projectMap,
  onClose,
  onEdit,
  onDelete,
}: EventDetailDrawerProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const isOpen = !!event

  function handleDelete() {
    if (!event) return
    if (!confirmingDelete) { setConfirmingDelete(true); return }
    onDelete(event.id)
    setConfirmingDelete(false)
  }

  function handleClose() {
    setConfirmingDelete(false)
    onClose()
  }

  const typeColor = event ? EVENT_TYPE_COLOR[event.type] ?? '#525252' : '#525252'
  const typeBadge = event ? EVENT_TYPE_BADGE[event.type] ?? '' : ''
  const typeLabel = event ? (EVENT_TYPE_LABEL[event.type] ?? event.type) : ''

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={handleClose}
      />

      <div
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-[460px] max-w-[calc(100vw-2rem)] border-l border-[#1f1f1f] bg-[#0a0a0a] shadow-2xl transition-transform duration-300 flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {!event ? null : (
          <>
            {/* Top color bar */}
            <div className="h-1 shrink-0" style={{ background: typeColor }} />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[#1f1f1f] px-5 py-4 shrink-0">
              <div className="min-w-0 flex-1">
                <span className={cn('mb-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', typeBadge)}>
                  {typeLabel}
                </span>
                <h2 className="text-base font-semibold leading-snug text-[#f5f5f5]">{event.title}</h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#525252] hover:bg-[#1a1a1a] hover:text-[#f5f5f5] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
              {/* Date / time */}
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 shrink-0 text-[#525252] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium capitalize text-[#e5e5e5]">{formatDateFull(event.start_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 shrink-0 text-[#525252]" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#a3a3a3]">{formatTimePair(event.start_at, event.end_at)}</span>
                    <span className="rounded-full bg-[#1a1a1a] px-2 py-0.5 text-xs text-[#525252]">
                      {durationLabel(event.start_at, event.end_at)}
                    </span>
                  </div>
                </div>
                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 shrink-0 text-[#525252] mt-0.5" />
                    <span className="text-sm text-[#a3a3a3] break-all">{event.location}</span>
                  </div>
                )}
                {event.project_id && projectMap[event.project_id] && (
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-4 w-4 shrink-0 text-[#525252]" />
                    <span className="text-sm text-[#a3a3a3]">{projectMap[event.project_id]}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {event.description && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <AlignLeft className="h-3.5 w-3.5 text-[#525252]" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#525252]">Descrição / Observações</span>
                  </div>
                  <p className="rounded-lg border border-[#1f1f1f] bg-[#111111] px-3 py-2.5 text-sm leading-relaxed text-[#a3a3a3] whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[#1f1f1f] px-5 py-4 flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => onEdit(event)}>
                <Edit2 className="h-3.5 w-3.5" />
                Editar
              </Button>
              <div className="flex-1" />
              {confirmingDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#ef4444]">Confirmar exclusão?</span>
                  <Button variant="danger" size="sm" onClick={handleDelete}>
                    Sim, excluir
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
                    Não
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={handleDelete}>
                  <Trash2 className="h-3.5 w-3.5 text-[#ef4444]" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
