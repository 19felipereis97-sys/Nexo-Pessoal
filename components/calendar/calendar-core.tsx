'use client'

import { useEffect, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import type {
  EventInput,
  DateSelectArg,
  EventClickArg,
  EventDropArg,
  EventHoveringArg,
  DatesSetArg,
} from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'

export interface CalendarCoreHandle {
  prev: () => void
  next: () => void
  today: () => void
  changeView: (view: string) => void
}

interface CalendarCoreProps {
  events: EventInput[]
  initialView: string
  onReady: (handle: CalendarCoreHandle) => void
  onDateSelect: (arg: DateSelectArg) => void
  onEventClick: (arg: EventClickArg) => void
  onEventDrop: (arg: EventDropArg) => void
  onEventResize: (arg: EventResizeDoneArg) => void
  onEventMouseEnter: (arg: EventHoveringArg) => void
  onEventMouseLeave: () => void
  onDatesSet: (arg: DatesSetArg) => void
}

export function CalendarCore({
  events,
  initialView,
  onReady,
  onDateSelect,
  onEventClick,
  onEventDrop,
  onEventResize,
  onEventMouseEnter,
  onEventMouseLeave,
  onDatesSet,
}: CalendarCoreProps) {
  const calRef = useRef<FullCalendar>(null)

  // Capture initial view once — FullCalendar treats initialView as dynamic and calling
  // setOption('initialView', x) navigates the calendar, so we must NOT re-pass it on every
  // render caused by handleDatesSet updating the view state in the parent.
  const [stableInitialView] = useState(initialView)

  // Expose the imperative API after mount using useEffect, which runs after React has
  // committed the DOM and set calRef.current. This is more reliable than viewDidMount /
  // datesSet callbacks which can fire in edge-case ordering relative to ref assignment.
  useEffect(() => {
    if (!calRef.current) return
    onReady({
      prev: () => calRef.current?.getApi().prev(),
      next: () => calRef.current?.getApi().next(),
      today: () => calRef.current?.getApi().today(),
      changeView: (v) => calRef.current?.getApi().changeView(v),
    })
  // Intentionally only on mount — the closures close over calRef (stable ref object),
  // so they always access the current FullCalendar instance.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <FullCalendar
      ref={calRef}
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView={stableInitialView}
      headerToolbar={false}
      locale={ptBrLocale}
      timeZone="local"
      height="100%"
      editable
      selectable
      selectMirror
      nowIndicator
      dayMaxEvents={4}
      eventDisplay="block"
      events={events}
      select={onDateSelect}
      eventClick={onEventClick}
      eventDrop={onEventDrop}
      eventResize={onEventResize}
      eventMouseEnter={onEventMouseEnter}
      eventMouseLeave={onEventMouseLeave}
      datesSet={onDatesSet}
      eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
      slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
    />
  )
}
