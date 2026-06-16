'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, FolderOpen, CheckCircle2, Circle } from 'lucide-react'
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
} from './constants'

interface TaskCardProps {
  task: Task
  projectName?: string
  isDragOverlay?: boolean
  onClick: () => void
  onToggleComplete: () => void
}

function dueDateLabel(due: string): { text: string; isOverdue: boolean } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(due + 'T00:00:00')
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  const isOverdue = diff < 0
  if (diff === 0) return { text: 'Hoje', isOverdue: false }
  if (diff === 1) return { text: 'Amanhã', isOverdue: false }
  if (diff === -1) return { text: 'Ontem', isOverdue: true }
  if (isOverdue) return { text: `${Math.abs(diff)}d atraso`, isOverdue: true }
  if (diff <= 7) return { text: `${diff}d`, isOverdue: false }
  return {
    text: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    isOverdue: false,
  }
}

export function TaskCard({ task, projectName, isDragOverlay, onClick, onToggleComplete }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled: isDragOverlay,
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  const status = task.status as TaskStatus
  const isCompleted = status === 'concluida'
  const due = task.due_date ? dueDateLabel(task.due_date) : null
  const priorityLabel = PRIORITY_LABEL[task.priority as keyof typeof PRIORITY_LABEL] ?? task.priority
  const priorityBadge = PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE['média']
  const priorityDot = PRIORITY_DOT[task.priority] ?? PRIORITY_DOT['média']

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-xl border bg-[#0d0d0d] p-3 transition-all select-none',
        isDragging
          ? 'opacity-30 border-[#c9a227]/20 cursor-grabbing'
          : 'border-[#1f1f1f] hover:border-[#333] hover:bg-[#111111] cursor-grab active:cursor-grabbing',
        isDragOverlay && 'shadow-2xl border-[#c9a227]/40 rotate-1 cursor-grabbing opacity-100',
        isCompleted && !isDragOverlay && 'opacity-60',
      )}
    >
      {/* Drag handle overlay — captures drag, click goes to content */}
      <div
        {...listeners}
        {...attributes}
        className="absolute inset-0 rounded-xl"
        aria-label="Arrastar tarefa"
      />

      {/* Content (above drag overlay) */}
      <div className="relative pointer-events-none">
        {/* Priority dot */}
        <div className="mb-2 flex items-center gap-1.5">
          <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', priorityDot)} />
          <span className={cn('text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded-full', priorityBadge)}>
            {priorityLabel}
          </span>
        </div>

        {/* Title */}
        <p className={cn('text-sm font-medium leading-snug text-[#f5f5f5] mb-2.5', isCompleted && 'line-through text-[#737373]')}>
          {task.title}
        </p>

        {/* Footer row */}
        <div className="flex items-center gap-2 flex-wrap">
          {due && (
            <span className={cn(
              'flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium',
              due.isOverdue
                ? 'bg-[#ef4444]/10 text-[#ef4444]'
                : 'bg-[#1a1a1a] text-[#737373]',
            )}>
              <Calendar className="h-2.5 w-2.5" />
              {due.text}
            </span>
          )}
          {projectName && (
            <span className="flex items-center gap-1 rounded-md bg-[#1a1a1a] px-1.5 py-0.5 text-[10px] text-[#525252]">
              <FolderOpen className="h-2.5 w-2.5" />
              <span className="max-w-[80px] truncate">{projectName}</span>
            </span>
          )}
        </div>
      </div>

      {/* Action buttons — pointer-events enabled, on top */}
      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tooltip content={isCompleted ? 'Reabrir' : 'Concluir'} side="top">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleComplete() }}
            className="relative z-10 flex h-6 w-6 items-center justify-center rounded-md text-[#525252] hover:text-[#22c55e] transition-colors pointer-events-auto"
          >
            {isCompleted
              ? <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
              : <Circle className="h-4 w-4" />
            }
          </button>
        </Tooltip>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClick() }}
          className="relative z-10 flex h-6 items-center justify-center rounded-md bg-[#1a1a1a] px-2 text-[10px] text-[#737373] hover:text-[#f5f5f5] transition-colors pointer-events-auto"
        >
          Ver
        </button>
      </div>

      {/* Status badge for list context */}
      <div className="mt-2 hidden">
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', STATUS_BADGE[status])}>
          {STATUS_LABEL[status]}
        </span>
      </div>
    </div>
  )
}
