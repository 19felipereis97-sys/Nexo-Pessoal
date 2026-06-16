'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createTask } from '@/lib/actions/tasks'
import { todayISO } from '@/lib/utils/date'

interface AddTaskModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const priorityOptions = [
  { value: 'urgente', label: '🔴 Urgente' },
  { value: 'alta', label: '🟠 Alta' },
  { value: 'média', label: '🟡 Média' },
  { value: 'baixa', label: '⚪ Baixa' },
]

export function AddTaskModal({ open, onClose, onSuccess }: AddTaskModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    priority: 'média',
    due_date: todayISO(),
    due_time: '',
    description: '',
  })

  const handleClose = () => {
    if (isPending) return
    setError(null)
    setForm({ title: '', priority: 'média', due_date: todayISO(), due_time: '', description: '' })
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createTask({
        title: form.title,
        priority: form.priority,
        due_date: form.due_date || undefined,
        due_time: form.due_time || undefined,
        description: form.description || undefined,
      })
      if (result.error) {
        setError(result.error)
      } else {
        onSuccess()
        handleClose()
      }
    })
  }

  return (
    <Modal open={open} onClose={handleClose} title="Adicionar tarefa" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Título *"
          placeholder="O que precisa ser feito?"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          disabled={isPending}
          autoFocus
        />

        <Select
          label="Prioridade"
          options={priorityOptions}
          value={form.priority}
          onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
          disabled={isPending}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Data de vencimento"
            type="date"
            value={form.due_date}
            onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
            disabled={isPending}
          />
          <Input
            label="Horário"
            type="time"
            value={form.due_time}
            onChange={(e) => setForm((f) => ({ ...f, due_time: e.target.value }))}
            disabled={isPending}
          />
        </div>

        <Textarea
          label="Descrição"
          placeholder="Detalhes adicionais..."
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          disabled={isPending}
          rows={3}
        />

        {error && (
          <p className="text-xs text-[#ef4444]">{error}</p>
        )}

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" variant="accent" loading={isPending} className="flex-1">
            Criar tarefa
          </Button>
        </div>
      </form>
    </Modal>
  )
}
