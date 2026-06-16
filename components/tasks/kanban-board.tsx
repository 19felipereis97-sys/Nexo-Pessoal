'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { TaskCard } from './task-card'
import { KanbanColumn } from './kanban-column'
import type { Task } from '@/lib/supabase/types'
import { TASK_STATUSES, type TaskStatus } from './constants'

interface KanbanBoardProps {
  tasks: Task[]
  projectMap: Record<string, string>
  onCardClick: (task: Task) => void
  onToggleComplete: (task: Task) => void
  onAddTask: (status: TaskStatus) => void
  onDragEnd: (taskId: string, newStatus: TaskStatus, oldStatus: TaskStatus) => void
}

export function KanbanBoard({
  tasks,
  projectMap,
  onCardClick,
  onToggleComplete,
  onAddTask,
  onDragEnd,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  function handleDragStart(event: DragStartEvent) {
    const task = event.active.data.current?.task as Task | undefined
    setActiveTask(task ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as TaskStatus
    const task = tasks.find((t) => t.id === taskId)

    if (!task || task.status === newStatus) return

    onDragEnd(taskId, newStatus, task.status as TaskStatus)
  }

  const tasksByStatus: Record<TaskStatus, Task[]> = {
    'backlog': [],
    'a-fazer': [],
    'em-andamento': [],
    'aguardando': [],
    'concluida': [],
  }
  for (const task of tasks) {
    const s = task.status as TaskStatus
    if (tasksByStatus[s]) {
      tasksByStatus[s].push(task)
    } else {
      tasksByStatus['backlog'].push(task)
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {TASK_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasksByStatus[status]}
            projectMap={projectMap}
            onCardClick={onCardClick}
            onToggleComplete={onToggleComplete}
            onAddTask={onAddTask}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
        {activeTask && (
          <TaskCard
            task={activeTask}
            projectName={activeTask.project_id ? projectMap[activeTask.project_id] : undefined}
            isDragOverlay
            onClick={() => {}}
            onToggleComplete={() => {}}
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
