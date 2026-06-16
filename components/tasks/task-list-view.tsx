'use client'

import {
  Calendar,
  FolderOpen,
  CheckCircle2,
  Circle,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/tooltip'
import type { Task } from '@/lib/supabase/types'
import {
  PRIORITY_LABEL,
  PRIORITY_BADGE,
  PRIORITY_DOT,
  STATUS_LABEL,
  STATUS_BADGE,
  type TaskStatus,
  type SortBy,
} from './constants'

interface TaskListViewProps {
  tasks: Task[]
  projectMap: Record<string, string>
  sortBy: SortBy
  sortDir: 'asc' | 'desc'
  onSortChange: (col: SortBy) => void
  onTaskClick: (task: Task) => void
  onToggleComplete: (task: Task) => void
  emptyLabel?: string
}

function DueDateCell({ due }: { due: string }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(due + 'T00:00:00')
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  const isOverdue = diff < 0
  let text = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  if (diff === 0) text = 'Hoje'
  else if (diff === 1) text = 'Amanhã'
  else if (diff === -1) text = 'Ontem'
  else if (isOverdue) text = `${Math.abs(diff)}d atraso`

  return (
    <span className={cn(
      'flex items-center gap-1 text-xs',
      isOverdue ? 'text-[#ef4444]' : 'text-[#737373]',
    )}>
      <Calendar className="h-3 w-3 shrink-0" />
      {text}
    </span>
  )
}

function SortIcon({ col, sortBy, sortDir }: { col: SortBy; sortBy: SortBy; sortDir: 'asc' | 'desc' }) {
  if (sortBy !== col) return <ChevronsUpDown className="h-3 w-3 text-[#333]" />
  return sortDir === 'asc'
    ? <ChevronUp className="h-3 w-3 text-[#c9a227]" />
    : <ChevronDown className="h-3 w-3 text-[#c9a227]" />
}

export function TaskListView({
  tasks,
  projectMap,
  sortBy,
  sortDir,
  onSortChange,
  onTaskClick,
  onToggleComplete,
  emptyLabel = 'Nenhuma tarefa encontrada.',
}: TaskListViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-[#525252]">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#1f1f1f] overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_140px_120px_120px_80px] items-center gap-3 border-b border-[#1f1f1f] bg-[#080808] px-4 py-2.5">
        <div className="w-5" />
        <button
          type="button"
          onClick={() => onSortChange('created_at')}
          className="flex items-center gap-1 text-left text-xs font-medium text-[#525252] hover:text-[#a3a3a3] transition-colors"
        >
          Tarefa
          <SortIcon col="created_at" sortBy={sortBy} sortDir={sortDir} />
        </button>
        <span className="text-xs font-medium text-[#525252]">Status</span>
        <button
          type="button"
          onClick={() => onSortChange('priority')}
          className="flex items-center gap-1 text-xs font-medium text-[#525252] hover:text-[#a3a3a3] transition-colors"
        >
          Prioridade
          <SortIcon col="priority" sortBy={sortBy} sortDir={sortDir} />
        </button>
        <button
          type="button"
          onClick={() => onSortChange('due_date')}
          className="flex items-center gap-1 text-xs font-medium text-[#525252] hover:text-[#a3a3a3] transition-colors"
        >
          Vencimento
          <SortIcon col="due_date" sortBy={sortBy} sortDir={sortDir} />
        </button>
        <span className="text-xs font-medium text-[#525252]">Projeto</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#111111]">
        {tasks.map((task) => {
          const status = task.status as TaskStatus
          const isCompleted = status === 'concluida'
          const priorityLabel = PRIORITY_LABEL[task.priority as keyof typeof PRIORITY_LABEL] ?? task.priority
          const priorityBadge = PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE['média']
          const priorityDot = PRIORITY_DOT[task.priority] ?? PRIORITY_DOT['média']

          return (
            <div
              key={task.id}
              className="group grid grid-cols-[auto_1fr_140px_120px_120px_80px] items-center gap-3 bg-[#0a0a0a] px-4 py-3 hover:bg-[#0d0d0d] transition-colors cursor-pointer"
              onClick={() => onTaskClick(task)}
            >
              {/* Toggle complete */}
              <Tooltip content={isCompleted ? 'Reabrir' : 'Marcar concluída'} side="right">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onToggleComplete(task) }}
                  className="flex h-5 w-5 items-center justify-center text-[#333] hover:text-[#22c55e] transition-colors"
                >
                  {isCompleted
                    ? <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
                    : <Circle className="h-4 w-4" />
                  }
                </button>
              </Tooltip>

              {/* Title */}
              <span className={cn(
                'truncate text-sm',
                isCompleted ? 'text-[#525252] line-through' : 'text-[#e5e5e5]',
              )}>
                {task.title}
              </span>

              {/* Status */}
              <span className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium w-fit',
                STATUS_BADGE[status],
              )}>
                {STATUS_LABEL[status]}
              </span>

              {/* Priority */}
              <Tooltip content={`Prioridade: ${priorityLabel}`} side="top">
                <span className={cn(
                  'flex items-center gap-1.5 text-xs font-medium w-fit',
                )}>
                  <span className={cn('h-2 w-2 rounded-full shrink-0', priorityDot)} />
                  <span className={cn('rounded-full px-1.5 py-0.5 text-[10px]', priorityBadge)}>
                    {priorityLabel}
                  </span>
                </span>
              </Tooltip>

              {/* Due date */}
              {task.due_date
                ? <DueDateCell due={task.due_date} />
                : <span className="text-xs text-[#333]">—</span>
              }

              {/* Project */}
              {task.project_id && projectMap[task.project_id]
                ? (
                  <Tooltip content={projectMap[task.project_id]} side="left">
                    <span className="flex items-center gap-1 text-xs text-[#525252] truncate">
                      <FolderOpen className="h-3 w-3 shrink-0" />
                      <span className="truncate">{projectMap[task.project_id]}</span>
                    </span>
                  </Tooltip>
                )
                : <span className="text-xs text-[#333]">—</span>
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}
