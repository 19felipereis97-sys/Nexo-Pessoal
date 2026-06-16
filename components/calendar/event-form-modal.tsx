'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CalendarEvent } from '@/lib/supabase/types'
import type { CreateEventInput } from '@/lib/actions/events'
import { EVENT_TYPES, EVENT_TYPE_LABEL } from './constants'

interface EventFormModalProps {
  open: boolean
  event?: CalendarEvent | null
  defaultStart?: string
  defaultEnd?: string
  defaultProjectId?: string
  projects: Array<{ id: string; name: string }>
  onClose: () => void
  onSubmit: (input: CreateEventInput, eventId?: string) => Promise<void>
}

function toInputDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toInputTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function isoToDateInput(value: string, fallback: string): string {
  if (!value) return fallback
  if (!value.includes('T')) return value.slice(0, 10)
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : toInputDate(date)
}

function isoToTimeInput(value: string, fallback: string): string {
  if (!value || !value.includes('T')) return fallback
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : toInputTime(date)
}

function buildISO(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString()
}

// Component remounts via key in parent — init state from props is fine
export function EventFormModal({
  open,
  event,
  defaultStart,
  defaultEnd,
  defaultProjectId,
  projects,
  onClose,
  onSubmit,
}: EventFormModalProps) {
  const today = toInputDate(new Date())
  const nowH = new Date().getHours().toString().padStart(2, '0')
  const defaultStartTime = `${nowH}:00`
  const defaultEndTime = `${String(Math.min(Number(nowH) + 1, 23)).padStart(2, '0')}:00`
  const startFallbackDate = event ? isoToDateInput(event.start_at, today) : defaultStart ? isoToDateInput(defaultStart, today) : today

  const [title, setTitle] = useState(event?.title ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [startDate, setStartDate] = useState(
    startFallbackDate,
  )
  const [startTime, setStartTime] = useState(
    event ? isoToTimeInput(event.start_at, defaultStartTime) : defaultStart ? isoToTimeInput(defaultStart, defaultStartTime) : defaultStartTime,
  )
  const [endDate, setEndDate] = useState(
    event ? isoToDateInput(event.end_at, startFallbackDate) : defaultEnd && defaultEnd.includes('T') ? isoToDateInput(defaultEnd, startFallbackDate) : startFallbackDate,
  )
  const [endTime, setEndTime] = useState(
    event ? isoToTimeInput(event.end_at, defaultEndTime) : defaultEnd ? isoToTimeInput(defaultEnd, defaultEndTime) : defaultEndTime,
  )
  const [type, setType] = useState(event?.type ?? 'compromisso')
  const [location, setLocation] = useState(event?.location ?? '')
  const [projectId, setProjectId] = useState(event?.project_id ?? defaultProjectId ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => titleRef.current?.focus(), 50)
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Título é obrigatório'); return }
    const start_at = buildISO(startDate, startTime)
    const end_at = buildISO(endDate, endTime)
    if (Number.isNaN(new Date(start_at).getTime()) || Number.isNaN(new Date(end_at).getTime())) {
      setError('Informe data e hora válidas')
      return
    }
    if (end_at <= start_at) { setError('O término deve ser depois do início'); return }
    setLoading(true)
    setError('')
    try {
      await onSubmit(
        { title, description, start_at, end_at, type, location, project_id: projectId || undefined },
        event?.id,
      )
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar compromisso')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-[#262626] bg-[#0d0d0d] shadow-2xl nexo-fade-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1f1f1f] px-5 py-4 shrink-0">
          <h2 className="text-sm font-semibold text-[#f5f5f5]">
            {event ? 'Editar compromisso' : 'Novo compromisso'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#525252] hover:bg-[#1a1a1a] hover:text-[#f5f5f5] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5 overflow-y-auto">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#737373]">Título *</label>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reunião com equipe"
              className="w-full rounded-lg border border-[#262626] bg-[#111111] px-3 py-2 text-sm text-[#f5f5f5] placeholder:text-[#333] focus:border-[#c9a227]/50 focus:outline-none"
            />
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#737373]">Tipo</label>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                    type === t
                      ? 'bg-[#c9a227]/10 border-[#c9a227]/40 text-[#c9a227]'
                      : 'bg-[#0d0d0d] border-[#1f1f1f] text-[#525252] hover:border-[#333] hover:text-[#a3a3a3]'
                  }`}
                >
                  {EVENT_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Start date+time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#737373]">Data início *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-[#262626] bg-[#111111] px-3 py-2 text-sm text-[#f5f5f5] focus:border-[#c9a227]/50 focus:outline-none [color-scheme:dark]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#737373]">Hora início *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-[#262626] bg-[#111111] px-3 py-2 text-sm text-[#f5f5f5] focus:border-[#c9a227]/50 focus:outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          {/* End date+time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#737373]">Data fim *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-[#262626] bg-[#111111] px-3 py-2 text-sm text-[#f5f5f5] focus:border-[#c9a227]/50 focus:outline-none [color-scheme:dark]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#737373]">Hora fim *</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-[#262626] bg-[#111111] px-3 py-2 text-sm text-[#f5f5f5] focus:border-[#c9a227]/50 focus:outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#737373]">Local / Link</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Sala 3 ou https://meet.google.com/..."
              className="w-full rounded-lg border border-[#262626] bg-[#111111] px-3 py-2 text-sm text-[#f5f5f5] placeholder:text-[#333] focus:border-[#c9a227]/50 focus:outline-none"
            />
          </div>

          {/* Project */}
          {projects.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#737373]">Projeto vinculado</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-lg border border-[#262626] bg-[#111111] px-3 py-2 text-sm text-[#f5f5f5] focus:border-[#c9a227]/50 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">Nenhum projeto</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Description / Observations */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#737373]">Descrição / Observações</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Pauta, links, anotações..."
              rows={3}
              className="w-full resize-none rounded-lg border border-[#262626] bg-[#111111] px-3 py-2 text-sm text-[#f5f5f5] placeholder:text-[#333] focus:border-[#c9a227]/50 focus:outline-none"
            />
          </div>

          {error && <p className="text-xs text-[#ef4444]">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="accent" size="sm" loading={loading}>
              {event ? 'Salvar alterações' : 'Criar compromisso'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
