'use client'

import { CheckCircle2, Circle, Clock, ListTodo, ChevronRight, Loader2, Plus } from 'lucide-react'
import { DashboardSectionCard } from './dashboard-section-card'
import { EmptyActionState } from './empty-action-state'
import { PremiumTooltip } from '@/components/ui/premium-tooltip'
import { Badge } from '@/components/ui/badge'
import {
  PRIORITY_DOT,
  PRIORITY_LABEL,
  PRIORITY_BADGE,
  TASK_STATUS_LABEL,
  TASK_STATUS_ORDER,
} from './constants'
import type { Task } from '@/lib/supabase/types'

interface TodayTasksPanelProps {
  tasks: Task[]
  isDone: (t: Task) => boolean
  pendingIds: Set<string>
  onToggle: (t: Task) => void
  onSelect: (t: Task) => void
  onCreate: () => void
}

export function TodayTasksPanel({ tasks, isDone, pendingIds, onToggle, onSelect, onCreate }: TodayTasksPanelProps) {
  const pending = tasks.filter((t) => !isDone(t)).length

  // Group by status (only show labels when more than one group is populated)
  const groups = TASK_STATUS_ORDER.map((status) => ({
    status,
    items: tasks.filter((t) => t.status === status),
  })).filter((g) => g.items.length > 0)
  const showGroupLabels = groups.length > 1

  return (
    <DashboardSectionCard
      icon={ListTodo}
      title="Tarefas de hoje"
      count={tasks.length}
      countVariant={pending === 0 && tasks.length > 0 ? 'success' : 'muted'}
      action={
        pending > 0 ? (
          <span className="text-xs text-[#737373]">{pending} pendente{pending > 1 ? 's' : ''}</span>
        ) : undefined
      }
    >
      {tasks.length === 0 ? (
        <EmptyActionState
          icon={ListTodo}
          title="Nenhuma tarefa para hoje"
          description="Organize seu dia criando a primeira tarefa."
          action={{ label: 'Criar primeira tarefa', onClick: onCreate, icon: Plus }}
        />
      ) : (
        <div className="flex flex-col">
          {groups.map((group) => (
            <div key={group.status}>
              {showGroupLabels && (
                <p className="px-5 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#525252]">
                  {TASK_STATUS_LABEL[group.status] ?? group.status}
                </p>
              )}
              <ul>
                {group.items.map((task) => {
                  const done = isDone(task)
                  const loading = pendingIds.has(task.id)
                  return (
                    <li
                      key={task.id}
                      onClick={() => onSelect(task)}
                      className="group flex cursor-pointer items-start gap-3 px-5 py-3 transition-colors hover:bg-[#0d0d0d]"
                    >
                      <PremiumTooltip content={done ? 'Marcar como pendente' : 'Concluir tarefa'} side="right">
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggle(task) }}
                          disabled={loading}
                          className="mt-0.5 shrink-0 transition-transform hover:scale-110 disabled:opacity-50"
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-[#c9a227]" />
                          ) : done ? (
                            <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
                          ) : (
                            <Circle className="h-4 w-4 text-[#333] group-hover:text-[#c9a227]" />
                          )}
                        </button>
                      </PremiumTooltip>

                      <PremiumTooltip
                        side="top"
                        title={task.title}
                        content={
                          <span>
                            {task.description ? task.description : 'Sem descrição.'}
                            <br />
                            <span className="text-[#737373]">
                              {PRIORITY_LABEL[task.priority] ?? task.priority}
                              {task.due_time ? ` · ${task.due_time.slice(0, 5)}` : ''}
                            </span>
                          </span>
                        }
                        className="min-w-0 flex-1"
                      >
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm leading-snug ${done ? 'text-[#525252] line-through' : 'text-[#f5f5f5]'}`}>
                            {task.title}
                          </p>
                          {task.due_time && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-[#737373]">
                              <Clock className="h-3 w-3" />
                              {task.due_time.slice(0, 5)}
                            </p>
                          )}
                        </div>
                      </PremiumTooltip>

                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant={PRIORITY_BADGE[task.priority] ?? 'muted'} className="text-[10px]">
                          {task.priority}
                        </Badge>
                        <PremiumTooltip content={PRIORITY_LABEL[task.priority] ?? task.priority} side="left">
                          <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[task.priority] ?? 'bg-[#525252]'}`} />
                        </PremiumTooltip>
                        <ChevronRight className="h-3.5 w-3.5 text-[#333] opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </DashboardSectionCard>
  )
}
