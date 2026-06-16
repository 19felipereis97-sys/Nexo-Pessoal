'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createProject } from '@/lib/actions/projects'

interface AddProjectModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const priorityOptions = [
  { value: 'critica', label: 'Crítica' },
  { value: 'alta', label: '🟠 Alta' },
  { value: 'média', label: '🟡 Média' },
  { value: 'baixa', label: '⚪ Baixa' },
]

export function AddProjectModal({ open, onClose, onSuccess }: AddProjectModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', priority: 'média', due_date: '', description: '' })

  const handleClose = () => {
    if (isPending) return
    setError(null)
    setForm({ name: '', priority: 'média', due_date: '', description: '' })
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createProject({
        name: form.name,
        priority: form.priority,
        due_date: form.due_date || undefined,
        description: form.description || undefined,
      })
      if (result.error) {
        setError(result.error)
      } else {
        onSuccess?.()
        handleClose()
      }
    })
  }

  return (
    <Modal open={open} onClose={handleClose} title="Novo projeto" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nome do projeto *"
          placeholder="Ex: Lançamento do produto X"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
        <Input
          label="Prazo final"
          type="date"
          value={form.due_date}
          onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
          disabled={isPending}
        />
        <Textarea
          label="Objetivo"
          placeholder="Descreva o objetivo do projeto..."
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          disabled={isPending}
          rows={3}
        />
        {error && <p className="text-xs text-[#ef4444]">{error}</p>}
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" variant="accent" loading={isPending} className="flex-1">
            Criar projeto
          </Button>
        </div>
      </form>
    </Modal>
  )
}
