'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { EventFormModal } from './event-form-modal'
import { EventDetailDrawer } from './event-detail-drawer'
import { DayAgendaPanel } from './day-agenda-panel'
import { CalendarFilters } from './calendar-filters'
import type { CalendarCoreHandle } from './calendar-core'
import type { CalendarEvent } from '@/lib/supabase/types'
import type { CreateEventInput } from '@/lib/actions/events'
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '@/lib/actions/events'
import {
  EVENT_TYPE_COLOR,
  VIEW_LABEL,
  VIEWS,
  type CalendarView,
} from './constants'
import type { EventInput, DateSelectArg, EventClickArg, EventDropArg, EventHoveringArg, DatesSetArg } from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'

// ── Dynamic import — FullCalendar never runs on the server ─────
const CalendarCore = dynamic(
  () => import('./calendar-core').then((m) => m.CalendarCore),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#525252]" />
      </div>
    ),
  },
)

// ── Toast ──────────────────────────────────────────────────────
type Toast = { id: number; message: string; type: 'success' | 'error' }

function Toasts({ items }: { items: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            'rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl nexo-fade-in',
            t.type === 'success'
              ? 'bg-[#0a0a0a]/95 border-[#22c55e]/30 text-[#22c55e]'
              : 'bg-[#0a0a0a]/95 border-[#ef4444]/30 text-[#ef4444]',
          )}
        >
          {t.type === 'success' ? '✓ ' : '✕ '}{t.message}
        </div>
      ))}
    </div>
  )
}

// ── Popover (event hover) ──────────────────────────────────────
interface PopoverState {
  event: CalendarEvent
  x: number
  y: number
}

function EventPopover({ data }: { data: PopoverState }) {
  const e = data.event
  const typeColor = EVENT_TYPE_COLOR[e.type] ?? '#525252'
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      className="fixed z-[9998] w-64 rounded-xl border border-[#262626] bg-[#111111] p-3 shadow-2xl nexo-fade-in pointer-events-none"
      style={{ left: data.x + 12, top: Math.min(data.y, window.innerHeight - 180) }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: typeColor }} />
        <p className="text-sm font-semibold text-[#f5f5f5] line-clamp-2">{e.title}</p>
      </div>
      <p className="text-xs text-[#737373]">{fmt(e.start_at)} – {fmt(e.end_at)}</p>
      {e.location && <p className="mt-1 text-xs text-[#525252] truncate">📍 {e.location}</p>}
      {e.description && (
        <p className="mt-1.5 text-xs leading-relaxed text-[#525252] line-clamp-2">{e.description}</p>
      )}
    </div>
  )
}

// ── Props ──────────────────────────────────────────────────────
interface CalendarClientProps {
  initialEvents: CalendarEvent[]
  projects: Array<{ id: string; name: string }>
  highlightId?: string
}

export function CalendarClient({ initialEvents, projects, highlightId }: CalendarClientProps) {
  const initialHighlightedEvent = initialEvents.find((event) => event.id === highlightId) ?? null
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [view, setView] = useState<CalendarView>('dayGridMonth')
  const [viewTitle, setViewTitle] = useState('')
  const [selectedDate, setSelectedDate] = useState(initialHighlightedEvent ? new Date(initialHighlightedEvent.start_at) : new Date())
  const [filterTypes, setFilterTypes] = useState<string[]>([])
  const [filterProject, setFilterProject] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(initialHighlightedEvent)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [defaultStart, setDefaultStart] = useState<string>()
  const [defaultEnd, setDefaultEnd] = useState<string>()
  const [popover, setPopover] = useState<PopoverState | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const calHandle = useRef<CalendarCoreHandle | null>(null)

  const projectMap = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p.name])),
    [projects],
  )

  // ── Toast ──────────────────────────────────────────────────
  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  // ── Filtered FC events ─────────────────────────────────────
  const fcEvents = useMemo<EventInput[]>(() => {
    let result = events
    if (filterTypes.length) result = result.filter((e) => filterTypes.includes(e.type))
    if (filterProject) result = result.filter((e) => e.project_id === filterProject)

    return result.map((e) => ({
      id: e.id,
      title: e.title,
      start: e.start_at,
      end: e.end_at,
      backgroundColor: EVENT_TYPE_COLOR[e.type] ?? '#525252',
      borderColor: 'transparent',
      textColor: '#f5f5f5',
      extendedProps: { raw: e },
    }))
  }, [events, filterTypes, filterProject])

  // ── FullCalendar handlers ──────────────────────────────────
  function handleDatesSet(arg: DatesSetArg) {
    setViewTitle(arg.view.title)
    setSelectedDate(arg.view.currentStart)
    setView(arg.view.type as CalendarView)
  }

  function handleDateSelect(arg: DateSelectArg) {
    setSelectedDate(arg.start)
    setDefaultStart(arg.startStr)
    setDefaultEnd(arg.endStr)
    setEditingEvent(null)
    setIsCreateOpen(true)
  }

  function handleEventClick(arg: EventClickArg) {
    const raw = arg.event.extendedProps.raw as CalendarEvent
    setSelectedEvent(raw)
  }

  function handleEventMouseEnter(arg: EventHoveringArg) {
    const raw = arg.event.extendedProps.raw as CalendarEvent
    const rect = arg.el.getBoundingClientRect()
    setPopover({ event: raw, x: rect.right, y: rect.top })
  }

  function handleEventMouseLeave() {
    setPopover(null)
  }

  function handleEventDrop(arg: EventDropArg) {
    const raw = arg.event.extendedProps.raw as CalendarEvent
    const newStart = arg.event.startStr
    const newEnd = arg.event.endStr
    const oldStart = raw.start_at
    const oldEnd = raw.end_at

    // Optimistic — FullCalendar already updated the display
    setEvents((prev) =>
      prev.map((e) =>
        e.id === raw.id ? { ...e, start_at: newStart, end_at: newEnd } : e,
      ),
    )

    updateCalendarEvent(raw.id, { start_at: newStart, end_at: newEnd }).then((result) => {
      if (result.error) {
        arg.revert()
        setEvents((prev) =>
          prev.map((e) => (e.id === raw.id ? { ...e, start_at: oldStart, end_at: oldEnd } : e)),
        )
        addToast('Erro ao mover compromisso', 'error')
      } else {
        addToast('Compromisso movido', 'success')
      }
    })
  }

  function handleEventResize(arg: EventResizeDoneArg) {
    const raw = arg.event.extendedProps.raw as CalendarEvent
    const newStart = arg.event.startStr
    const newEnd = arg.event.endStr
    const oldStart = raw.start_at
    const oldEnd = raw.end_at

    setEvents((prev) =>
      prev.map((e) =>
        e.id === raw.id ? { ...e, start_at: newStart, end_at: newEnd } : e,
      ),
    )

    updateCalendarEvent(raw.id, { start_at: newStart, end_at: newEnd }).then((result) => {
      if (result.error) {
        arg.revert()
        setEvents((prev) =>
          prev.map((e) => (e.id === raw.id ? { ...e, start_at: oldStart, end_at: oldEnd } : e)),
        )
        addToast('Erro ao redimensionar compromisso', 'error')
      } else {
        addToast('Duração atualizada', 'success')
      }
    })
  }

  // ── CRUD handlers ──────────────────────────────────────────
  async function handleFormSubmit(input: CreateEventInput, eventId?: string) {
    if (eventId) {
      const result = await updateCalendarEvent(eventId, input)
      if (result.error) { addToast(result.error, 'error'); throw new Error(result.error) }
      setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, ...input } : e)))
      if (selectedEvent?.id === eventId) setSelectedEvent((prev) => (prev ? { ...prev, ...input } : prev))
      addToast('Compromisso atualizado', 'success')
    } else {
      const result = await createCalendarEvent(input)
      if (result.error || !result.event) {
        const message = result.error ?? 'Erro ao criar compromisso'
        addToast(message, 'error')
        throw new Error(message)
      }
      setEvents((prev) => [...prev, result.event!])
      addToast('Compromisso criado', 'success')
    }
  }

  function handleDelete(eventId: string) {
    const previous = events
    setSelectedEvent(null)
    setEvents((prev) => prev.filter((e) => e.id !== eventId))
    deleteCalendarEvent(eventId).then((result) => {
      if (result.error) {
        setEvents(previous)
        addToast(result.error, 'error')
      } else {
        addToast('Compromisso excluído', 'success')
      }
    })
  }

  function openCreate() {
    setDefaultStart(undefined)
    setDefaultEnd(undefined)
    setEditingEvent(null)
    setIsCreateOpen(true)
  }

  // ── View switcher ──────────────────────────────────────────
  function switchView(v: CalendarView) {
    calHandle.current?.changeView(v)
    setView(v)
  }

  return (
    <div className="flex flex-col gap-3 lg:h-full lg:overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 shrink-0 sm:flex-row sm:items-center sm:gap-3">
        {/* Row 1 mobile: Nav + Title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => calHandle.current?.prev()}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] text-[#737373] hover:border-[#333] hover:text-[#f5f5f5] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => calHandle.current?.today()}
              className="rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-3 py-1.5 text-xs font-medium text-[#737373] hover:border-[#333] hover:text-[#f5f5f5] transition-colors"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => calHandle.current?.next()}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] text-[#737373] hover:border-[#333] hover:text-[#f5f5f5] transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <h2 className="flex-1 min-w-0 truncate text-base font-semibold capitalize text-[#e5e5e5]">{viewTitle}</h2>
        </div>

        {/* Row 2 mobile: View switcher + Add button */}
        <div className="flex items-center gap-2 sm:ml-auto shrink-0">
          <div className="flex items-center rounded-lg border border-[#1f1f1f] bg-[#080808] p-0.5 gap-0.5">
            {VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => switchView(v)}
                className={cn(
                  'px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
                  view === v
                    ? 'bg-[#1a1a1a] text-[#f5f5f5]'
                    : 'text-[#525252] hover:text-[#a3a3a3]',
                )}
              >
                {VIEW_LABEL[v]}
              </button>
            ))}
          </div>

          <Button variant="accent" size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            Compromisso
          </Button>
        </div>
      </div>

      {/* Filters — scrollável horizontalmente no mobile */}
      <div className="overflow-x-auto shrink-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <CalendarFilters
          filterTypes={filterTypes}
          filterProject={filterProject}
          projects={projects}
          onChange={(types, project) => { setFilterTypes(types); setFilterProject(project) }}
        />
      </div>

      {/* Main area — coluna no mobile, linha no desktop */}
      <div className="flex flex-col gap-3 lg:flex-row lg:min-h-0 lg:flex-1">
        {/* Calendar */}
        <div className="nexo-calendar h-[400px] sm:h-[480px] lg:h-auto lg:min-h-0 lg:flex-1 rounded-xl border border-[#1f1f1f] bg-[#080808] overflow-hidden">
          <CalendarCore
            events={fcEvents}
            initialView={view}
            onReady={(handle) => { calHandle.current = handle }}
            onDateSelect={handleDateSelect}
            onEventClick={handleEventClick}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            onEventMouseEnter={handleEventMouseEnter}
            onEventMouseLeave={handleEventMouseLeave}
            onDatesSet={handleDatesSet}
          />
        </div>

        {/* Day agenda panel — altura fixa no mobile, lateral no desktop */}
        <div className="h-52 sm:h-60 lg:h-auto lg:w-64 lg:shrink-0 lg:min-h-0">
          <DayAgendaPanel
            events={events}
            selectedDate={selectedDate}
            onEventClick={setSelectedEvent}
            onAddEvent={openCreate}
          />
        </div>
      </div>

      {/* Event detail drawer */}
      <EventDetailDrawer
        event={selectedEvent}
        projectMap={projectMap}
        onClose={() => setSelectedEvent(null)}
        onEdit={(e) => { setEditingEvent(e); setSelectedEvent(null) }}
        onDelete={handleDelete}
      />

      {/* Create / edit modal — key forces remount per event */}
      <EventFormModal
        key={editingEvent?.id ?? (isCreateOpen ? `new-${defaultStart ?? 'now'}` : 'closed')}
        open={isCreateOpen || !!editingEvent}
        event={editingEvent}
        defaultStart={defaultStart}
        defaultEnd={defaultEnd}
        projects={projects}
        onClose={() => { setIsCreateOpen(false); setEditingEvent(null) }}
        onSubmit={handleFormSubmit}
      />

      {/* Hover popover */}
      {popover && <EventPopover data={popover} />}

      {/* Toasts */}
      <Toasts items={toasts} />
    </div>
  )
}
