'use client'

import { useState } from 'react'
import {
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  Circle,
  Calendar,
  FolderOpen,
  AlignLeft,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import type { Task } from '@/lib/supabase/types'
import {
  PRIORITY_LABEL,
  PRIORITY_DOT,
  STATUS_LABEL,
  STATUS_BADGE,
  STATUS_DOT,
  TASK_STATUSES,
  TASK_PRIORITIES,
  type TaskStatus,
} from './constants'

interface TaskDetailDrawerProps {
  task: Task | null
  projectMap: Record<string, string>
  onClose: () => void
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onToggleComplete: (task: Task) => void
  onStatusChange: (taskId: string, status: string) => void
  onPriorityChange: (taskId: string, priority: string) => void
}

function formatFullDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatCreatedAt(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function daysOverdue(due: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(due + 'T00:00:00')
  return Math.round((today.getTime() - d.getTime()) / 86400000)
}

export function TaskDetailDrawer({
  task,
  projectMap,
  onClose,
  onEdit,
  onDelete,
  onToggleComplete,
  onStatusChange,
  onPriorityChange,
}: TaskDetailDrawerProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const isOpen = !!task

  function handleDelete() {
    if (!task) return
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      return
    }
    onDelete(task.id)
    setConfirmingDelete(false)
  }

  function handleClose() {
    setConfirmingDelete(false)
    onClose()
  }

  const status = task?.status as TaskStatus | undefined
  const isCompleted = status === 'concluida'
  const overdue = task?.due_date && !isCompleted ? daysOverdue(task.due_date) : 0

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-[480px] max-w-[calc(100vw-2rem)] border-l border-[#1f1f1f] bg-[#0a0a0a] shadow-2xl transition-transform duration-300 flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {!task ? null : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[#1f1f1f] px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('h-2 w-2 rounded-full shrink-0', status ? STATUS_DOT[status] : 'bg-[#525252]')} />
                  <span className={cn('text-xs font-medium rounded-full px-2 py-0.5', status ? STATUS_BADGE[status] : '')}>
                    {status ? STATUS_LABEL[status] : ''}
                  </span>
                </div>
                <h2 className={cn(
                  'text-base font-semibold leading-snug text-[#f5f5f5]',
                  isCompleted && 'line-through text-[#737373]',
                )}>
                  {task.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#525252] hover:bg-[#1a1a1a] hover:text-[#f5f5f5] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Overdue banner */}
            {overdue > 0 && (
              <div className="flex items-center gap-2 border-b border-[#ef4444]/10 bg-[#ef4444]/5 px-5 py-2.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#ef4444]" />
                <p className="text-xs text-[#ef4444]">
                  {overdue === 1 ? 'Venceu ontem' : `Venceu há ${overdue} dias`}
                </p>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Status selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#525252]">Status</label>
                  <select
                    value={task.status}
                    onChange={(e) => onStatusChange(task.id, e.target.value)}
                    className="w-full rounded-lg border border-[#1f1f1f] bg-[#111111] px-2.5 py-1.5 text-sm text-[#e5e5e5] focus:border-[#c9a227]/40 focus:outline-none cursor-pointer appearance-none"
                  >
                    {TASK_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </div>

                {/* Priority selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#525252]">Prioridade</label>
                  <div className="relative">
                    <select
                      value={task.priority}
                      onChange={(e) => onPriorityChange(task.id, e.target.value)}
                      className="w-full rounded-lg border border-[#1f1f1f] bg-[#111111] px-2.5 py-1.5 pl-6 text-sm text-[#e5e5e5] focus:border-[#c9a227]/40 focus:outline-none cursor-pointer appearance-none"
                    >
                      {TASK_PRIORITIES.map((p) => (
                        <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
                      ))}
                    </select>
                    <span className={cn(
                      'pointer-events-none absolute left-2.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full',
                      PRIORITY_DOT[task.priority] ?? 'bg-[#525252]',
                    )} />
                  </div>
                </div>

                {/* Due date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#525252]">Vencimento</label>
                  {task.due_date ? (
                    <div className="flex items-center gap-1.5 text-sm text-[#a3a3a3]">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-[#525252]" />
                      <span className={cn(overdue > 0 && 'text-[#ef4444]')}>
                        {formatFullDate(task.due_date)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-[#333]">Sem data</span>
                  )}
                </div>

                {/* Project */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#525252]">Projeto</label>
                  {task.project_id && projectMap[task.project_id] ? (
                    <div className="flex items-center gap-1.5 text-sm text-[#a3a3a3]">
                      <FolderOpen className="h-3.5 w-3.5 shrink-0 text-[#525252]" />
                      {projectMap[task.project_id]}
                    </div>
                  ) : (
                    <span className="text-sm text-[#333]">Sem projeto</span>
                  )}
                </div>

                {/* Time */}
                {task.due_time && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-[#525252]">Horário</label>
                    <div className="flex items-center gap-1.5 text-sm text-[#a3a3a3]">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-[#525252]" />
                      {task.due_time}
                    </div>
                  </div>
                )}

                {/* Created at */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#525252]">Criada em</label>
                  <span className="text-sm text-[#525252]">{formatCreatedAt(task.created_at)}</span>
                </div>
              </div>

              {/* Description */}
              {task.description && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <AlignLeft className="h-3.5 w-3.5 text-[#525252]" />
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-[#525252]">Descrição</label>
                  </div>
                  <p className="rounded-lg border border-[#1f1f1f] bg-[#111111] px-3 py-2.5 text-sm leading-relaxed text-[#a3a3a3] whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="border-t border-[#1f1f1f] px-5 py-4 flex items-center gap-2">
              <Tooltip content={isCompleted ? 'Reabrir tarefa' : 'Marcar como concluída'} side="top">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onToggleComplete(task)}
                  className={cn(isCompleted && 'border-[#22c55e]/30 text-[#22c55e] hover:border-[#22c55e]/50')}
                >
                  {isCompleted
                    ? <><CheckCircle2 className="h-3.5 w-3.5" /> Reabrir</>
                    : <><Circle className="h-3.5 w-3.5" /> Concluir</>
                  }
                </Button>
              </Tooltip>

              <Button variant="secondary" size="sm" onClick={() => onEdit(task)}>
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
