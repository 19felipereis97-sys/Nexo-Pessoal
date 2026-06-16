'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { createProject, updateProject, type CreateProjectInput } from '@/lib/actions/projects'
import type { Project } from '@/lib/supabase/types'
import { PROJECT_PRIORITIES, PROJECT_PRIORITY_LABEL, PROJECT_STATUSES, PROJECT_STATUS_LABEL } from './constants'

export function ProjectFormModal({ open, project, onClose, onSaved }: {
  open: boolean
  project?: Project | null
  onClose: () => void
  onSaved: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [form, setForm] = useState<CreateProjectInput>({
    name: project?.name ?? '',
    description: project?.description ?? '',
    status: project?.status ?? 'planejado',
    priority: project?.priority ?? 'média',
    start_date: project?.start_date ?? '',
    due_date: project?.due_date ?? '',
  })

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    startTransition(async () => {
      const result = project ? await updateProject(project.id, form) : await createProject(form)
      if (result.error) return setError(result.error)
      onSaved()
      onClose()
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={project ? 'Editar projeto' : 'Novo projeto'} size="lg">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Nome do projeto *" value={form.name} autoFocus disabled={pending}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <Select label="Status" value={form.status} disabled={pending}
          options={PROJECT_STATUSES.map((value) => ({ value, label: PROJECT_STATUS_LABEL[value] }))}
          onChange={(e) => setForm({ ...form, status: e.target.value })} />
        <Select label="Prioridade" value={form.priority} disabled={pending}
          options={PROJECT_PRIORITIES.map((value) => ({ value, label: PROJECT_PRIORITY_LABEL[value] }))}
          onChange={(e) => setForm({ ...form, priority: e.target.value })} />
        <Input label="Data de início" type="date" value={form.start_date} disabled={pending}
          onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        <Input label="Prazo final" type="date" value={form.due_date} disabled={pending}
          onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
        <div className="sm:col-span-2">
          <Textarea label="Objetivo" rows={4} value={form.description} disabled={pending}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        {error && <p className="text-xs text-[#ef4444] sm:col-span-2">{error}</p>}
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>Cancelar</Button>
          <Button type="submit" variant="accent" loading={pending}>{project ? 'Salvar alterações' : 'Criar projeto'}</Button>
        </div>
      </form>
    </Modal>
  )
}
