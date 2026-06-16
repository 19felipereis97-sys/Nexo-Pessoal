'use client'

import { useCallback, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { KanbanBoard } from './kanban-board'
import { TaskListView } from './task-list-view'
import { TaskDetailDrawer } from './task-detail-drawer'
import { TaskFormModal } from './task-form-modal'
import { TaskFilters } from './task-filters'
import type { Task } from '@/lib/supabase/types'
import type { CreateTaskInput } from '@/lib/actions/tasks'
import {
  createTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  updateTaskStatus,
} from '@/lib/actions/tasks'
import { PRIORITY_ORDER, type TaskStatus, type ViewType, type SortBy } from './constants'

// ── Toast ──────────────────────────────────────────────────────────
type Toast = { id: number; message: string; type: 'success' | 'error' }

function Toasts({ items }: { items: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            'rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl nexo-fade-in backdrop-blur-sm',
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

// ── Filter state ───────────────────────────────────────────────────
interface FilterState {
  search: string
  status: string[]
  priority: string[]
  projectId: string
  sortBy: SortBy
  sortDir: 'asc' | 'desc'
}

const DEFAULT_FILTERS: FilterState = {
  search: '',
  status: [],
  priority: [],
  projectId: '',
  sortBy: 'created_at',
  sortDir: 'desc',
}

// ── Props ──────────────────────────────────────────────────────────
interface TasksClientProps {
  initialTasks: Task[]
  projects: Array<{ id: string; name: string }>
}

export function TasksClient({ initialTasks, projects }: TasksClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [view, setView] = useState<ViewType>('kanban')
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [defaultStatus, setDefaultStatus] = useState('backlog')
  const [toasts, setToasts] = useState<Toast[]>([])

  const projectMap = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p.name])),
    [projects],
  )

  // ── Toast ──────────────────────────────────────────────────────
  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  // ── Filtered tasks ─────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]
    const weekEnd = new Date(today)
    weekEnd.setDate(today.getDate() + 7)
    const weekEndStr = weekEnd.toISOString().split('T')[0]

    let result = tasks

    // View-based filter
    if (view === 'hoje') {
      result = result.filter((t) => t.due_date === todayStr && t.status !== 'concluida')
    } else if (view === 'semana') {
      result = result.filter(
        (t) => t.due_date && t.due_date >= todayStr && t.due_date <= weekEndStr && t.status !== 'concluida',
      )
    } else if (view === 'atrasadas') {
      result = result.filter((t) => t.due_date && t.due_date < todayStr && t.status !== 'concluida')
    } else if (view === 'concluidas') {
      result = result.filter((t) => t.status === 'concluida')
    } else if (view === 'lista') {
      result = result.filter((t) => t.status !== 'concluida')
    }
    // kanban: no view filter, shows all statuses as columns

    // Search
    if (filters.search) {
      const term = filters.search.toLowerCase()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          (t.description?.toLowerCase().includes(term) ?? false),
      )
    }

    // Status filter (kanban + lista only)
    if (filters.status.length && (view === 'kanban' || view === 'lista')) {
      result = result.filter((t) => filters.status.includes(t.status))
    }

    // Priority filter
    if (filters.priority.length) {
      result = result.filter((t) => filters.priority.includes(t.priority))
    }

    // Project filter
    if (filters.projectId) {
      result = result.filter((t) => t.project_id === filters.projectId)
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0
      if (filters.sortBy === 'priority') {
        cmp = (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
      } else if (filters.sortBy === 'due_date') {
        if (!a.due_date && !b.due_date) cmp = 0
        else if (!a.due_date) cmp = 1
        else if (!b.due_date) cmp = -1
        else cmp = a.due_date.localeCompare(b.due_date)
      } else {
        cmp = a.created_at.localeCompare(b.created_at)
      }
      return filters.sortDir === 'desc' ? -cmp : cmp
    })

    return result
  }, [tasks, view, filters])

  // ── Drag end handler ───────────────────────────────────────────
  function handleDragEnd(taskId: string, newStatus: TaskStatus, oldStatus: TaskStatus) {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus, completed_at: newStatus === 'concluida' ? new Date().toISOString() : null }
          : t,
      ),
    )
    // Sync with selected task if open
    setSelectedTask((prev) =>
      prev?.id === taskId ? { ...prev, status: newStatus } : prev,
    )

    updateTaskStatus(taskId, newStatus).then((result) => {
      if (result.error) {
        // Revert
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: oldStatus } : t)),
        )
        addToast('Erro ao mover tarefa', 'error')
      } else {
        addToast(`Movido para ${newStatus === 'concluida' ? 'Concluída' : newStatus}`, 'success')
      }
    })
  }

  // ── Toggle complete ────────────────────────────────────────────
  function handleToggleComplete(task: Task) {
    const isCompleted = task.status === 'concluida'
    const newStatus = isCompleted ? 'em-andamento' : 'concluida'

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, status: newStatus, completed_at: !isCompleted ? new Date().toISOString() : null }
          : t,
      ),
    )
    setSelectedTask((prev) =>
      prev?.id === task.id ? { ...prev, status: newStatus } : prev,
    )

    toggleTaskComplete(task.id, !isCompleted).then((result) => {
      if (result.error) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)),
        )
        addToast('Erro ao atualizar tarefa', 'error')
      } else {
        addToast(isCompleted ? 'Tarefa reaberta' : 'Tarefa concluída', 'success')
      }
    })
  }

  // ── Create / Edit ──────────────────────────────────────────────
  async function handleFormSubmit(input: CreateTaskInput, taskId?: string) {
    if (taskId) {
      const result = await updateTask(taskId, input)
      if (result.error) { addToast('Erro ao salvar tarefa', 'error'); return }
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...input } : t)),
      )
      setSelectedTask((prev) =>
        prev?.id === taskId ? { ...prev, ...input } : prev,
      )
      addToast('Tarefa atualizada', 'success')
    } else {
      const result = await createTask(input)
      if (result.error || !result.task) { addToast('Erro ao criar tarefa', 'error'); return }
      setTasks((prev) => [result.task!, ...prev])
      addToast('Tarefa criada', 'success')
    }
  }

  // ── Delete ─────────────────────────────────────────────────────
  function handleDelete(taskId: string) {
    setSelectedTask(null)
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    deleteTask(taskId).then((result) => {
      if (result.error) {
        addToast('Erro ao excluir tarefa', 'error')
        // Cannot easily revert without the original task — just show error
      } else {
        addToast('Tarefa excluída', 'success')
      }
    })
  }

  // ── Status / Priority in-drawer changes ───────────────────────
  function handleStatusChange(taskId: string, status: string) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)))
    setSelectedTask((prev) => (prev?.id === taskId ? { ...prev, status } : prev))
    updateTaskStatus(taskId, status).then((result) => {
      if (result.error) addToast('Erro ao atualizar status', 'error')
      else addToast('Status atualizado', 'success')
    })
  }

  function handlePriorityChange(taskId: string, priority: string) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, priority } : t)))
    setSelectedTask((prev) => (prev?.id === taskId ? { ...prev, priority } : prev))
    updateTask(taskId, { priority }).then((result) => {
      if (result.error) addToast('Erro ao atualizar prioridade', 'error')
      else addToast('Prioridade atualizada', 'success')
    })
  }

  // ── Open create with status preset ────────────────────────────
  function handleAddTaskInColumn(status: TaskStatus) {
    setDefaultStatus(status)
    setEditingTask(null)
    setIsCreateOpen(true)
  }

  // ── Empty labels per view ──────────────────────────────────────
  const emptyLabels: Record<ViewType, string> = {
    kanban: 'Nenhuma tarefa.',
    lista: 'Nenhuma tarefa ativa.',
    hoje: 'Sem tarefas para hoje.',
    semana: 'Sem tarefas para esta semana.',
    atrasadas: 'Nenhuma tarefa em atraso.',
    concluidas: 'Nenhuma tarefa concluída.',
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Filters */}
      <TaskFilters
        view={view}
        filters={filters}
        projects={projects}
        totalCount={tasks.length}
        filteredCount={filteredTasks.length}
        onChange={setFilters}
        onViewChange={setView}
        onAddTask={() => { setDefaultStatus('backlog'); setEditingTask(null); setIsCreateOpen(true) }}
      />

      {/* Main content */}
      {view === 'kanban' ? (
        <KanbanBoard
          tasks={filteredTasks}
          projectMap={projectMap}
          onCardClick={setSelectedTask}
          onToggleComplete={handleToggleComplete}
          onAddTask={handleAddTaskInColumn}
          onDragEnd={handleDragEnd}
        />
      ) : (
        <TaskListView
          tasks={filteredTasks}
          projectMap={projectMap}
          sortBy={filters.sortBy}
          sortDir={filters.sortDir}
          onSortChange={(col) => {
            setFilters((prev) => ({
              ...prev,
              sortBy: col,
              sortDir: prev.sortBy === col && prev.sortDir === 'asc' ? 'desc' : 'asc',
            }))
          }}
          onTaskClick={setSelectedTask}
          onToggleComplete={handleToggleComplete}
          emptyLabel={emptyLabels[view]}
        />
      )}

      {/* Detail drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        projectMap={projectMap}
        onClose={() => setSelectedTask(null)}
        onEdit={(task) => { setEditingTask(task); setIsCreateOpen(false) }}
        onDelete={handleDelete}
        onToggleComplete={handleToggleComplete}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
      />

      {/* Create / Edit modal — key forces remount so form state resets on each open */}
      <TaskFormModal
        key={editingTask?.id ?? (isCreateOpen ? `new-${defaultStatus}` : 'closed')}
        open={isCreateOpen || !!editingTask}
        task={editingTask}
        defaultStatus={defaultStatus}
        projects={projects}
        onClose={() => { setIsCreateOpen(false); setEditingTask(null) }}
        onSubmit={handleFormSubmit}
      />

      {/* Toasts */}
      <Toasts items={toasts} />
    </div>
  )
}
