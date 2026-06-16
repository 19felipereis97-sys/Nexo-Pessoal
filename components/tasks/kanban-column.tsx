'use client'

import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TaskCard } from './task-card'
import type { Task } from '@/lib/supabase/types'
import { STATUS_LABEL, STATUS_DOT, type TaskStatus } from './constants'

interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  projectMap: Record<string, string>
  onCardClick: (task: Task) => void
  onToggleComplete: (task: Task) => void
  onAddTask: (status: TaskStatus) => void
  isOver?: boolean
}

export function KanbanColumn({
  status,
  tasks,
  projectMap,
  onCardClick,
  onToggleComplete,
  onAddTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex min-w-[260px] flex-1 flex-col rounded-xl border border-[#1f1f1f] bg-[#080808]">
      {/* Column header */}
      <div className="flex items-center gap-2 border-b border-[#1f1f1f] px-3 py-2.5">
        <span className={cn('h-2 w-2 rounded-full shrink-0', STATUS_DOT[status])} />
        <span className="flex-1 text-sm font-medium text-[#e5e5e5]">{STATUS_LABEL[status]}</span>
        <span className="rounded-full bg-[#1a1a1a] px-2 py-0.5 text-xs text-[#525252]">{tasks.length}</span>
        <button
          type="button"
          onClick={() => onAddTask(status)}
          className="flex h-5 w-5 items-center justify-center rounded text-[#525252] hover:bg-[#1f1f1f] hover:text-[#a3a3a3] transition-colors"
          aria-label={`Adicionar tarefa em ${STATUS_LABEL[status]}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-1 flex-col gap-2 p-2 min-h-[200px] transition-colors duration-150',
          isOver && 'bg-[#c9a227]/[0.04] rounded-b-xl',
        )}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            projectName={task.project_id ? projectMap[task.project_id] : undefined}
            onClick={() => onCardClick(task)}
            onToggleComplete={() => onToggleComplete(task)}
          />
        ))}

        {tasks.length === 0 && !isOver && (
          <div className="flex flex-1 items-center justify-center py-8">
            <p className="text-xs text-[#333]">Solte aqui</p>
          </div>
        )}

        {isOver && (
          <div className="rounded-lg border-2 border-dashed border-[#c9a227]/30 bg-[#c9a227]/5 py-4 text-center">
            <p className="text-xs text-[#c9a227]/60">Mover para {STATUS_LABEL[status]}</p>
          </div>
        )}
      </div>
    </div>
  )
}
