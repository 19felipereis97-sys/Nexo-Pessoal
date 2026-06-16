'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CalendarDays, CheckCircle2, Circle, GripVertical, ListChecks, NotebookPen, Play, RefreshCw, RotateCcw, Sparkles, Square, Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { PremiumTooltip } from '@/components/ui/premium-tooltip'
import { Textarea } from '@/components/ui/textarea'
import { EventDrawer } from '@/components/dashboard/event-drawer'
import { TaskDrawer } from '@/components/dashboard/task-drawer'
import { toggleTaskComplete } from '@/lib/actions/tasks'
import { convertDailyNoteToTask, createDailyNote, planToday, reorderTodayTasks, rescheduleTask, saveDailyReview, startFocus, stopFocus } from '@/lib/actions/today'
import { logRoutineComplete, unlogRoutineComplete } from '@/lib/actions/routines'
import type { TodayData } from '@/lib/data/today'
import type { CalendarEvent, FocusSession, Routine, RoutineLog, Task } from '@/lib/supabase/types'
import { formatTime, formatTimeRange, greetingByHour, todayISO } from '@/lib/utils/date'
import { PRIORITY_LABEL, PRIORITY_ORDER } from '@/components/tasks/constants'

export function TodayClient({ initialData }: { initialData: TodayData }) {
  const router = useRouter()
  const [tasks, setTasks] = useState(initialData.tasks)
  const [notes, setNotes] = useState(initialData.notes)
  const [routineLogs, setRoutineLogs] = useState<RoutineLog[]>(initialData.todayRoutineLogs)
  const [focus, setFocus] = useState<FocusSession | null>(initialData.activeFocus)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [modal, setModal] = useState<'plan' | 'close' | 'reschedule' | null>(null)
  const [rescheduling, setRescheduling] = useState<Task | null>(null)
  const [pending, startTransition] = useTransition()
  const refresh = () => router.refresh()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const activeFocusTask = focus?.task_id ? tasks.find((task) => task.id === focus.task_id) : tasks.find((task) => task.status !== 'concluida')
  const orderedTasks = useMemo(() => [...tasks].sort((a, b) => (a.execution_order ?? 999) - (b.execution_order ?? 999)), [tasks])

  function dragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return
    const from = orderedTasks.findIndex((task) => task.id === event.active.id)
    const to = orderedTasks.findIndex((task) => task.id === event.over?.id)
    if (from < 0 || to < 0) return
    const next = [...orderedTasks]; const [moved] = next.splice(from, 1); next.splice(to, 0, moved)
    setTasks(next.map((task, index) => ({ ...task, execution_order: index })))
    reorderTodayTasks(next.map((task) => task.id))
  }
  function toggle(task: Task) {
    const done = task.status === 'concluida'
    setTasks((items) => items.map((item) => item.id === task.id ? { ...item, status: done ? 'em-andamento' : 'concluida' } : item))
    toggleTaskComplete(task.id, !done).then(refresh)
  }
  function doPlan() {
    const next = [...tasks].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9) || (a.due_time ?? '99:99').localeCompare(b.due_time ?? '99:99'))
    setTasks(next.map((task, index) => ({ ...task, execution_order: index })))
    startTransition(async () => { await planToday(next.map((task) => task.id)); setModal(null); refresh() })
  }
  function beginFocus() {
    startTransition(async () => { const result = await startFocus(activeFocusTask?.id); if (result.session) setFocus(result.session); refresh() })
  }
  function endFocus() {
    if (!focus) return
    startTransition(async () => { await stopFocus(focus.id); setFocus(null); refresh() })
  }

  return <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
    <header className="flex flex-col gap-4 rounded-2xl border border-[#292720] bg-gradient-to-r from-[#15130d] to-[#0d0d0d] p-5 lg:flex-row lg:items-center lg:justify-between">
      <div><p className="text-xs uppercase tracking-[0.18em] text-[#c9a227]">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p><h1 className="mt-2 text-2xl font-semibold text-[#f5f5f5]">{greetingByHour()}, {initialData.profile?.full_name?.split(' ')[0] ?? 'vamos começar'}.</h1><p className="mt-1 text-sm text-[#737373]">{tasks.filter((task) => task.status !== 'concluida').length} tarefas pendentes · {initialData.events.length} compromissos · {initialData.overdueTasks.length} vencidas</p></div>
      <div className="flex flex-wrap gap-2"><Button variant={focus ? 'danger' : 'accent'} onClick={focus ? endFocus : beginFocus} loading={pending}>{focus ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}{focus ? 'Encerrar foco' : 'Iniciar foco'}</Button><Button onClick={() => setModal('plan')}><Sparkles className="h-4 w-4" /> Planejar dia</Button><Button onClick={() => setModal('close')}><CheckCircle2 className="h-4 w-4" /> Fechar dia</Button></div>
    </header>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <main className="flex min-w-0 flex-col gap-5">
        <Panel title="Tarefas de hoje" icon={<ListChecks className="h-4 w-4" />} badge={`${tasks.filter((t) => t.status === 'concluida').length}/${tasks.length}`}>
          {tasks.length ? <DndContext sensors={sensors} onDragEnd={dragEnd}><div className="flex flex-col gap-2">{orderedTasks.map((task) => <DraggableTask key={task.id} task={task} onOpen={() => setSelectedTask(task)} onToggle={() => toggle(task)} onReschedule={() => { setRescheduling(task); setModal('reschedule') }} />)}</div></DndContext> : <EmptyState title="Nenhuma tarefa para hoje" description="Seu espaço de execução está livre." />}
        </Panel>
        <Panel title="Linha do tempo do dia" icon={<CalendarDays className="h-4 w-4" />} badge={String(initialData.events.length)}>
          <Timeline events={initialData.events} onOpen={setSelectedEvent} />
        </Panel>
      </main>
      <aside className="flex flex-col gap-5">
        <FocusCard focus={focus} task={activeFocusTask} onStart={beginFocus} onStop={endFocus} pending={pending} />
        <Panel title="Pendências vencidas" icon={<AlertTriangle className="h-4 w-4 text-[#ef4444]" />} badge={String(initialData.overdueTasks.length)}>
          {initialData.overdueTasks.length ? <div className="flex flex-col gap-2">{initialData.overdueTasks.map((task) => <button key={task.id} onClick={() => setSelectedTask(task)} className="rounded-lg border border-[#ef4444]/15 bg-[#ef4444]/5 p-3 text-left"><p className="text-sm text-[#e5e5e5]">{task.title}</p><p className="mt-1 text-xs text-[#ef4444]">Venceu em {task.due_date}</p></button>)}</div> : <EmptyState title="Nenhuma pendência vencida" className="py-6" />}</Panel>
        <QuickNotes notes={notes} onAdd={(note) => setNotes((items) => [note, ...items])} onConverted={(noteId, task) => { setNotes((items) => items.map((note) => note.id === noteId ? { ...note, converted_task_id: task.id } : note)); setTasks((items) => [...items, task]); refresh() }} />
        {initialData.todayRoutines.length > 0 && (
          <RoutinesTodayPanel
            routines={initialData.todayRoutines}
            logs={routineLogs}
            today={todayISO()}
            onToggle={async (routineId, done) => {
              const date = todayISO()
              setRoutineLogs((prev) =>
                done
                  ? prev.filter((l) => !(l.routine_id === routineId && l.reference_date === date))
                  : [...prev, { id: `opt-${routineId}`, routine_id: routineId, user_id: '', completed_at: new Date().toISOString(), reference_date: date, notes: null, created_at: new Date().toISOString() }]
              )
              if (done) await unlogRoutineComplete(routineId, date)
              else await logRoutineComplete(routineId, date)
              refresh()
            }}
          />
        )}
      </aside>
    </div>

    <TaskDrawer key={selectedTask?.id ?? 'closed'} task={selectedTask} onClose={() => setSelectedTask(null)} onRefresh={refresh} />
    <EventDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    <PlanModal open={modal === 'plan'} tasks={tasks} events={initialData.events} pending={pending} onClose={() => setModal(null)} onApply={doPlan} />
    <CloseDayModal open={modal === 'close'} initial={initialData.review?.summary ?? ''} tasks={tasks} onClose={() => setModal(null)} onSaved={refresh} />
    <RescheduleModal key={rescheduling?.id ?? 'none'} task={rescheduling} open={modal === 'reschedule'} onClose={() => { setModal(null); setRescheduling(null) }} onSaved={(taskId, date, time) => { setTasks((items) => date === todayISO() ? items.map((task) => task.id === taskId ? { ...task, due_date: date, due_time: time || null } : task) : items.filter((task) => task.id !== taskId)); refresh() }} />
  </div>
}

function Panel({ title, icon, badge, children }: { title: string; icon: React.ReactNode; badge?: string; children: React.ReactNode }) { return <section className="rounded-xl border border-[#262626] bg-[#0d0d0d] p-4"><header className="mb-4 flex items-center gap-2 text-sm font-medium text-[#f5f5f5]">{icon}{title}{badge && <Badge variant="muted">{badge}</Badge>}</header>{children}</section> }

function DraggableTask({ task, onOpen, onToggle, onReschedule }: { task: Task; onOpen: () => void; onToggle: () => void; onReschedule: () => void }) {
  const drag = useDraggable({ id: task.id }); const drop = useDroppable({ id: task.id })
  return <div ref={(node) => { drag.setNodeRef(node); drop.setNodeRef(node) }} style={{ transform: drag.transform ? `translate3d(${drag.transform.x}px,${drag.transform.y}px,0)` : undefined }} className={`flex items-center gap-2 rounded-xl border bg-[#111] p-3 ${drag.isDragging ? 'border-[#c9a227]/50 opacity-60' : drop.isOver ? 'border-[#c9a227]/30' : 'border-[#1f1f1f]'}`}>
    <button aria-label="Arrastar tarefa" {...drag.listeners} {...drag.attributes} className="cursor-grab text-[#525252]"><GripVertical className="h-4 w-4" /></button>
    <PremiumTooltip content={task.status === 'concluida' ? 'Reabrir tarefa' : 'Marcar como concluída'}><button onClick={onToggle}>{task.status === 'concluida' ? <CheckCircle2 className="h-4 w-4 text-[#22c55e]" /> : <Circle className="h-4 w-4 text-[#525252]" />}</button></PremiumTooltip>
    <PremiumTooltip title={task.title} content={task.description || 'Sem descrição'} className="min-w-0 flex-1"><button onClick={onOpen} className="w-full min-w-0 text-left"><p className={`truncate text-sm ${task.status === 'concluida' ? 'text-[#525252] line-through' : 'text-[#f5f5f5]'}`}>{task.title}</p><p className="mt-0.5 text-xs text-[#525252]">{task.due_time?.slice(0, 5) || 'Sem horário'}</p></button></PremiumTooltip>
    <Badge variant={task.priority === 'critica' ? 'danger' : task.priority === 'alta' ? 'warning' : 'muted'}>{(PRIORITY_LABEL as Record<string, string>)[task.priority] ?? task.priority}</Badge>
    <Button aria-label="Reagendar tarefa" size="icon" variant="ghost" className="h-7 w-7" onClick={onReschedule}><RefreshCw className="h-3.5 w-3.5" /></Button>
  </div>
}

function Timeline({ events, onOpen }: { events: CalendarEvent[]; onOpen: (event: CalendarEvent) => void }) {
  if (!events.length) return <EmptyState title="Agenda livre hoje" description="Use esse espaço para foco profundo." />
  return <div>{events.map((event, index) => <div key={event.id} className="flex gap-3"><div className="w-12 pt-1 text-right text-xs text-[#a3a3a3]">{formatTime(event.start_at)}</div><div className="flex flex-col items-center"><span className="mt-1 h-2.5 w-2.5 rounded-full border-2 border-[#c9a227]" />{index < events.length - 1 && <span className="w-px flex-1 bg-[#262626]" />}</div><PremiumTooltip content={`${formatTimeRange(event.start_at, event.end_at)} · ${event.location || 'Sem local'}`} className="mb-3 min-w-0 flex-1"><button onClick={() => onOpen(event)} className="w-full rounded-lg border border-[#1f1f1f] bg-[#111] p-3 text-left hover:border-[#333]"><p className="text-sm text-[#f5f5f5]">{event.title}</p><p className="mt-1 text-xs text-[#737373]">{formatTimeRange(event.start_at, event.end_at)}</p></button></PremiumTooltip></div>)}</div>
}

function FocusCard({ focus, task, onStart, onStop, pending }: { focus: FocusSession | null; task?: Task; onStart: () => void; onStop: () => void; pending: boolean }) {
  const [elapsed, setElapsed] = useState(() => focus ? Math.floor((Date.now() - new Date(focus.started_at).getTime()) / 1000) : 0)
  useEffect(() => { if (!focus) return; const timer = setInterval(() => setElapsed(Math.floor((Date.now() - new Date(focus.started_at).getTime()) / 1000)), 1000); return () => clearInterval(timer) }, [focus])
  const shownElapsed = focus ? elapsed : 0
  const time = `${String(Math.floor(shownElapsed / 60)).padStart(2, '0')}:${String(shownElapsed % 60).padStart(2, '0')}`
  return <section className="rounded-xl border border-[#c9a227]/25 bg-[#c9a227]/5 p-4"><p className="flex items-center gap-2 text-sm font-medium text-[#c9a227]"><Target className="h-4 w-4" /> Bloco de foco atual</p><p className="mt-3 text-sm text-[#f5f5f5]">{task?.title || 'Escolha a primeira prioridade do dia'}</p><p className="mt-2 font-mono text-3xl font-semibold text-[#f5f5f5]">{time}</p><Button className="mt-4 w-full" variant={focus ? 'danger' : 'accent'} loading={pending} onClick={focus ? onStop : onStart}>{focus ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}{focus ? 'Encerrar foco' : 'Iniciar foco'}</Button></section>
}

function QuickNotes({ notes, onAdd, onConverted }: { notes: TodayData['notes']; onAdd: (note: TodayData['notes'][number]) => void; onConverted: (noteId: string, task: Task) => void }) {
  const [content, setContent] = useState(''); const [pending, startTransition] = useTransition()
  function add() { startTransition(async () => { const result = await createDailyNote(content); if (result.note) { onAdd(result.note); setContent('') } }) }
  function convert(id: string) { startTransition(async () => { const result = await convertDailyNoteToTask(id); if (result.task) onConverted(id, result.task) }) }
  return <Panel title="Notas rápidas do dia" icon={<NotebookPen className="h-4 w-4" />} badge={String(notes.length)}><div className="flex gap-2"><Input aria-label="Nova nota rápida" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Capture uma ideia..." onKeyDown={(e) => { if (e.key === 'Enter') add() }} /><Button aria-label="Adicionar nota rápida" size="icon" variant="accent" loading={pending} onClick={add}><NotebookPen className="h-4 w-4" /></Button></div><div className="mt-3 flex flex-col gap-2">{notes.map((note) => <div key={note.id} className="rounded-lg border border-[#1f1f1f] bg-[#111] p-3"><p className="text-xs text-[#a3a3a3]">{note.content}</p><div className="mt-2 flex justify-end">{note.converted_task_id ? <Badge variant="success">Virou tarefa</Badge> : <Button size="sm" variant="ghost" onClick={() => convert(note.id)}>Transformar em tarefa</Button>}</div></div>)}</div></Panel>
}

function RoutinesTodayPanel({ routines, logs, today, onToggle }: { routines: Routine[]; logs: RoutineLog[]; today: string; onToggle: (routineId: string, done: boolean) => void }) {
  const done = logs.filter((l) => routines.some((r) => r.id === l.routine_id) && l.reference_date === today).length
  return (
    <Panel title="Rotinas de hoje" icon={<RotateCcw className="h-4 w-4" />} badge={`${done}/${routines.length}`}>
      <div className="flex flex-col gap-2">
        {routines.map((routine) => {
          const isDone = logs.some((l) => l.routine_id === routine.id && l.reference_date === today)
          return (
            <div key={routine.id} className={`flex items-center gap-3 rounded-lg border p-3 ${isDone ? 'border-green-900/25 bg-green-950/10' : 'border-[#1f1f1f] bg-[#111]'}`}>
              <button onClick={() => onToggle(routine.id, isDone)} className={`shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${isDone ? 'border-green-500 bg-green-900/40' : 'border-[#525252] hover:border-[#c9a227]'}`}>
                {isDone && <CheckCircle2 className="h-3 w-3 text-green-400" />}
              </button>
              <p className={`flex-1 text-sm ${isDone ? 'line-through text-[#525252]' : 'text-[#e5e5e5]'}`}>{routine.title}</p>
              {routine.target_time && <span className="text-xs text-[#525252]">{routine.target_time.slice(0, 5)}</span>}
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

function PlanModal({ open, tasks, events, pending, onClose, onApply }: { open: boolean; tasks: Task[]; events: CalendarEvent[]; pending: boolean; onClose: () => void; onApply: () => void }) {
  const suggested = [...tasks].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9))
  return <Modal open={open} onClose={onClose} title="Planejar o dia" description="Ordenação simples baseada em prioridade e horário."><div className="grid grid-cols-2 gap-3"><Metric value={String(tasks.length)} label="tarefas" /><Metric value={String(events.length)} label="compromissos" /></div><div className="my-4 flex flex-col gap-2">{suggested.slice(0, 6).map((task, index) => <div key={task.id} className="flex gap-3 rounded-lg border border-[#262626] p-3 text-sm"><span className="text-[#c9a227]">{index + 1}</span><span className="text-[#a3a3a3]">{task.title}</span></div>)}</div><div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button variant="accent" loading={pending} onClick={onApply}>Aplicar planejamento</Button></div></Modal>
}
function Metric({ value, label }: { value: string; label: string }) { return <div className="rounded-lg border border-[#262626] bg-[#0d0d0d] p-3 text-center"><p className="text-xl font-semibold text-[#f5f5f5]">{value}</p><p className="text-xs text-[#737373]">{label}</p></div> }

function CloseDayModal({ open, initial, tasks, onClose, onSaved }: { open: boolean; initial: string; tasks: Task[]; onClose: () => void; onSaved: () => void }) {
  const [summary, setSummary] = useState(initial); const [pending, startTransition] = useTransition(); const done = tasks.filter((task) => task.status === 'concluida').length
  function save() { startTransition(async () => { const result = await saveDailyReview(summary); if (!result.error) { onSaved(); onClose() } }) }
  return <Modal open={open} onClose={onClose} title="Fechar dia" description={`${done} de ${tasks.length} tarefas concluídas.`}><Textarea label="Resumo manual" rows={7} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="O que avançou? O que precisa continuar amanhã?" /><div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button variant="accent" loading={pending} onClick={save}>Salvar fechamento</Button></div></Modal>
}
function RescheduleModal({ task, open, onClose, onSaved }: { task: Task | null; open: boolean; onClose: () => void; onSaved: (taskId: string, date: string, time: string) => void }) {
  const [date, setDate] = useState(todayISO()); const [time, setTime] = useState(task?.due_time?.slice(0, 5) ?? ''); const [pending, startTransition] = useTransition()
  function save() { if (!task) return; startTransition(async () => { const result = await rescheduleTask(task.id, date, time); if (!result.error) { onSaved(task.id, date, time); onClose() } }) }
  return <Modal open={open} onClose={onClose} title="Reagendar tarefa" description={task?.title}><div className="grid grid-cols-2 gap-3"><Input label="Nova data" type="date" value={date} onChange={(e) => setDate(e.target.value)} /><Input label="Horário" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div><div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button variant="accent" loading={pending} onClick={save}>Reagendar</Button></div></Modal>
}
