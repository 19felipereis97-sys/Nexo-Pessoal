'use client'

import { useMemo } from 'react'
import { Clock, CheckCircle2, Calendar, AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatTimeRange } from '@/lib/utils/date'
import type { Task, CalendarEvent } from '@/lib/supabase/types'

interface PlanDayModalProps {
  open: boolean
  onClose: () => void
  tasks: Task[]
  events: CalendarEvent[]
}

const PRIORITY_ORDER: Record<string, number> = { urgente: 0, alta: 1, média: 2, baixa: 3 }
const PRIORITY_BADGE: Record<string, 'danger' | 'warning' | 'muted' | 'accent'> = {
  urgente: 'danger',
  alta: 'danger',
  média: 'warning',
  baixa: 'muted',
}

interface ScheduleBlock {
  type: 'event' | 'task' | 'free'
  label: string
  time?: string
  priority?: string
  durationMin: number
}

function buildSchedule(tasks: Task[], events: CalendarEvent[]): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = []

  // Sort events by time
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
  )

  // Sort tasks: those with due_time first (by time), then by priority
  const timedTasks = tasks
    .filter((t) => t.due_time)
    .sort((a, b) => (a.due_time ?? '').localeCompare(b.due_time ?? ''))

  const untimedTasks = tasks
    .filter((t) => !t.due_time)
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9))

  // Add event blocks
  for (const event of sortedEvents) {
    const start = new Date(event.start_at)
    const end = new Date(event.end_at)
    const durationMin = Math.round((end.getTime() - start.getTime()) / 60000)
    blocks.push({
      type: 'event',
      label: event.title,
      time: formatTimeRange(event.start_at, event.end_at),
      durationMin,
    })
  }

  // Add timed tasks
  for (const task of timedTasks) {
    blocks.push({
      type: 'task',
      label: task.title,
      time: task.due_time ? task.due_time.slice(0, 5) : undefined,
      priority: task.priority,
      durationMin: 30,
    })
  }

  // Add untimed tasks
  for (const task of untimedTasks) {
    blocks.push({
      type: 'task',
      label: task.title,
      priority: task.priority,
      durationMin: 30,
    })
  }

  return blocks
}

export function PlanDayModal({ open, onClose, tasks, events }: PlanDayModalProps) {
  const schedule = useMemo(() => buildSchedule(tasks, events), [tasks, events])

  const totalTaskMin = tasks.length * 30
  const totalEventMin = events.reduce((acc, e) => {
    return acc + Math.round((new Date(e.end_at).getTime() - new Date(e.start_at).getTime()) / 60000)
  }, 0)

  const formatDuration = (min: number) => {
    if (min < 60) return `${min}min`
    return `${Math.floor(min / 60)}h${min % 60 > 0 ? `${min % 60}min` : ''}`
  }

  return (
    <Modal open={open} onClose={onClose} title="Planejamento do dia" description="Visão geral do que está agendado e pendente hoje" size="md">
      <div className="flex flex-col gap-5">
        {/* Resumo */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-[#262626] bg-[#0d0d0d] p-3 text-center">
            <p className="text-xl font-bold text-[#c9a227]">{tasks.length}</p>
            <p className="text-xs text-[#737373] mt-0.5">tarefas</p>
          </div>
          <div className="rounded-lg border border-[#262626] bg-[#0d0d0d] p-3 text-center">
            <p className="text-xl font-bold text-[#f5f5f5]">{events.length}</p>
            <p className="text-xs text-[#737373] mt-0.5">eventos</p>
          </div>
          <div className="rounded-lg border border-[#262626] bg-[#0d0d0d] p-3 text-center">
            <p className="text-xl font-bold text-[#a3a3a3]">{formatDuration(totalTaskMin + totalEventMin)}</p>
            <p className="text-xs text-[#737373] mt-0.5">estimado</p>
          </div>
        </div>

        {/* Aviso de urgentes */}
        {tasks.some((t) => t.priority === 'urgente') && (
          <div className="flex items-center gap-2.5 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/5 px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#ef4444]" />
            <p className="text-xs text-[#ef4444]">
              Você tem {tasks.filter((t) => t.priority === 'urgente').length} tarefa(s) urgente(s) hoje. Comece por elas.
            </p>
          </div>
        )}

        {/* Timeline */}
        {schedule.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#262626] py-8 text-center">
            <p className="text-sm text-[#737373]">Nenhuma tarefa ou evento para hoje.</p>
            <p className="mt-1 text-xs text-[#525252]">Aproveite o dia livre!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-0 max-h-[380px] overflow-y-auto pr-1">
            <p className="mb-2 text-xs font-medium text-[#737373]">Sugestão de ordem</p>
            {schedule.map((block, i) => (
              <div key={i} className="flex gap-3">
                {/* Linha de tempo */}
                <div className="flex flex-col items-center">
                  <div className={`h-2 w-2 mt-2 rounded-full shrink-0 ${
                    block.type === 'event' ? 'bg-[#c9a227]' : 'bg-[#333]'
                  }`} />
                  {i < schedule.length - 1 && (
                    <div className="w-px flex-1 bg-[#1a1a1a] mt-1" />
                  )}
                </div>

                {/* Conteúdo */}
                <div className={`flex-1 pb-4 ${i === schedule.length - 1 ? 'pb-0' : ''}`}>
                  <div className={`rounded-lg border p-3 ${
                    block.type === 'event'
                      ? 'border-[#c9a227]/20 bg-[#c9a227]/5'
                      : 'border-[#262626] bg-[#0d0d0d]'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {block.type === 'event' ? (
                          <Calendar className="h-3.5 w-3.5 text-[#c9a227] shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#525252] shrink-0 mt-0.5" />
                        )}
                        <span className="text-sm text-[#f5f5f5] leading-snug">{block.label}</span>
                      </div>
                      {block.priority && (
                        <Badge variant={PRIORITY_BADGE[block.priority] ?? 'muted'} className="shrink-0 text-[10px]">
                          {block.priority}
                        </Badge>
                      )}
                    </div>
                    {block.time && (
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-[#737373]">
                        <Clock className="h-3 w-3" />
                        {block.time}
                      </div>
                    )}
                    <p className="mt-1 text-xs text-[#525252]">
                      ~{formatDuration(block.durationMin)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-1 border-t border-[#262626]">
          <Button variant="accent" onClick={onClose} className="w-full">
            Entendido, vamos começar!
          </Button>
        </div>
      </div>
    </Modal>
  )
}
