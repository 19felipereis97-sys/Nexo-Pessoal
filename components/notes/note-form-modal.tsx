'use client'

import { useMemo, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { createNote, updateNote, type NoteInput } from '@/lib/actions/notes'
import type { Meeting, Note, Project, Task } from '@/lib/supabase/types'
import { NOTE_TYPES, NOTE_TYPE_LABEL } from './constants'

export function NoteFormModal({ open, note, projects, tasks, meetings, onClose, onSaved }: {
  open: boolean
  note?: Note | null
  projects: Array<Pick<Project, 'id' | 'name'>>
  tasks: Array<Pick<Task, 'id' | 'title' | 'project_id'>>
  meetings: Array<Pick<Meeting, 'id' | 'title' | 'project_id'>>
  onClose: () => void
  onSaved: (note?: Note) => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [form, setForm] = useState<NoteInput>({
    title: note?.title ?? '',
    content: note?.content ?? '',
    type: note?.type ?? 'nota_rapida',
    project_id: note?.project_id ?? '',
    task_id: note?.task_id ?? '',
    meeting_id: note?.meeting_id ?? '',
  })

  // Filter tasks and meetings by selected project
  const filteredTasks = useMemo(() =>
    form.project_id
      ? tasks.filter((t) => !t.project_id || t.project_id === form.project_id)
      : tasks,
    [tasks, form.project_id],
  )

  const filteredMeetings = useMemo(() =>
    form.project_id
      ? meetings.filter((m) => !m.project_id || m.project_id === form.project_id)
      : meetings,
    [meetings, form.project_id],
  )

  function set<K extends keyof NoteInput>(key: K, value: NoteInput[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      // Clear dependent selects when project changes
      if (key === 'project_id') {
        const task = tasks.find((t) => t.id === prev.task_id)
        const meeting = meetings.find((m) => m.id === prev.meeting_id)
        if (task && task.project_id && task.project_id !== value) next.task_id = ''
        if (meeting && meeting.project_id && meeting.project_id !== value) next.meeting_id = ''
      }
      return next
    })
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    startTransition(async () => {
      if (note) {
        const result = await updateNote(note.id, form)
        if (result.error) return setError(result.error)
        onSaved()
      } else {
        const result = await createNote(form)
        if (result.error) return setError(result.error)
        onSaved(result.note ?? undefined)
      }
      onClose()
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={note ? 'Editar nota' : 'Nova nota'} size="lg" className="max-h-[92vh] overflow-y-auto">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Título *" value={form.title} onChange={(e) => set('title', e.target.value)} autoFocus />
        </div>

        <Select
          label="Tipo"
          value={form.type}
          options={NOTE_TYPES.map((type) => ({ value: type, label: NOTE_TYPE_LABEL[type] }))}
          onChange={(e) => set('type', e.target.value)}
        />

        <Select
          label="Projeto"
          value={form.project_id}
          options={[{ value: '', label: 'Sem projeto' }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
          onChange={(e) => set('project_id', e.target.value)}
        />

        <Select
          label="Tarefa vinculada"
          value={form.task_id}
          options={[{ value: '', label: 'Sem tarefa' }, ...filteredTasks.map((t) => ({ value: t.id, label: t.title }))]}
          onChange={(e) => set('task_id', e.target.value)}
        />

        <Select
          label="Reunião vinculada"
          value={form.meeting_id}
          options={[{ value: '', label: 'Sem reunião' }, ...filteredMeetings.map((m) => ({ value: m.id, label: m.title }))]}
          onChange={(e) => set('meeting_id', e.target.value)}
        />

        <div className="sm:col-span-2">
          <MarkdownEditor
            label="Conteúdo"
            value={form.content ?? ''}
            onChange={(v) => set('content', v)}
            placeholder="Escreva com suporte a **negrito**, _itálico_, ## títulos, - listas..."
            rows={12}
          />
        </div>

        {error && <p className="text-xs text-[#ef4444] sm:col-span-2">{error}</p>}

        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="accent" loading={pending}>{note ? 'Salvar alterações' : 'Criar nota'}</Button>
        </div>
      </form>
    </Modal>
  )
}
