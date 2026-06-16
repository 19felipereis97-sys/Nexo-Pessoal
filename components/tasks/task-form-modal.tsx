'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Task } from '@/lib/supabase/types'
import type { CreateTaskInput } from '@/lib/actions/tasks'
import { TASK_STATUSES, TASK_PRIORITIES, STATUS_LABEL, PRIORITY_LABEL } from './constants'

interface TaskFormModalProps {
  open: boolean
  task?: Task | null
  defaultStatus?: string
  defaultProjectId?: string
  projects: Array<{ id: string; name: string }>
  onClose: () => void
  onSubmit: (input: CreateTaskInput, taskId?: string) => Promise<void>
}

// Rendered with a key that changes when task/open changes — so state initializes fresh on each open.
export function TaskFormModal({
  open,
  task,
  defaultStatus,
  defaultProjectId,
  projects,
  onClose,
  onSubmit,
}: TaskFormModalProps) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [status, setStatus] = useState(task?.status ?? defaultStatus ?? 'backlog')
  const [priority, setPriority] = useState(task?.priority ?? 'média')
  const [dueDate, setDueDate] = useState(task?.due_date ?? '')
  const [dueTime, setDueTime] = useState(task?.due_time ?? '')
  const [projectId, setProjectId] = useState(task?.project_id ?? defaultProjectId ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  const isEdit = !!task

  useEffect(() => {
    if (open) {
      setTimeout(() => titleRef.current?.focus(), 50)
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Título é obrigatório'); return }
    setLoading(true)
    setError('')
    try {
      await onSubmit(
        {
          title,
          description,
          status,
          priority,
          due_date: dueDate,
          due_time: dueTime,
          project_id: projectId || undefined,
        },
        task?.id,
      )
      onClose()
    } catch {
      setError('Erro ao salvar tarefa')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-[#262626] bg-[#0d0d0d] shadow-2xl nexo-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1f1f1f] px-5 py-4">
          <h2 className="text-sm font-semibold text-[#f5f5f5]">
            {isEdit ? 'Editar tarefa' : 'Nova tarefa'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#525252] hover:bg-[#1a1a1a] hover:text-[#f5f5f5] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#737373]">Título *</label>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Revisar proposta do cliente"
              className="w-full rounded-lg border border-[#262626] bg-[#111111] px-3 py-2 text-sm text-[#f5f5f5] placeholder:text-[#333] focus:border-[#c9a227]/50 focus:outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#737373]">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes sobre a tarefa..."
              rows={3}
              className="w-full resize-none rounded-lg border border-[#262626] bg-[#111111] px-3 py-2 text-sm text-[#f5f5f5] placeholder:text-[#333] focus:border-[#c9a227]/50 focus:outline-none transition-colors"
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#737373]">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-[#262626] bg-[#111111] px-3 py-2 text-sm text-[#f5f5f5] focus:border-[#c9a227]/50 focus:outline-none transition-colors appearance-none cursor-pointer"
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#737373]">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-[#262626] bg-[#111111] px-3 py-2 text-sm text-[#f5f5f5] focus:border-[#c9a227]/50 focus:outline-none transition-colors appearance-none cursor-pointer"
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#737373]">Vencimento</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-[#262626] bg-[#111111] px-3 py-2 text-sm text-[#f5f5f5] focus:border-[#c9a227]/50 focus:outline-none transition-colors [color-scheme:dark]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#737373]">Horário</label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full rounded-lg border border-[#262626] bg-[#111111] px-3 py-2 text-sm text-[#f5f5f5] focus:border-[#c9a227]/50 focus:outline-none transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Project */}
          {projects.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#737373]">Projeto</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-lg border border-[#262626] bg-[#111111] px-3 py-2 text-sm text-[#f5f5f5] focus:border-[#c9a227]/50 focus:outline-none transition-colors appearance-none cursor-pointer"
              >
                <option value="">Nenhum projeto</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-xs text-[#ef4444]">{error}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="accent" size="sm" loading={loading}>
              {isEdit ? 'Salvar alterações' : 'Criar tarefa'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
