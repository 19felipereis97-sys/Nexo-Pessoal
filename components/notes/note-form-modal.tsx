'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
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
  return <Modal open={open} onClose={onClose} title={note ? 'Editar nota' : 'Nova nota'} size="lg" className="max-h-[92vh] overflow-y-auto">
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><Input label="Título *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus /></div>
      <Select label="Tipo" value={form.type} options={NOTE_TYPES.map((type) => ({ value: type, label: NOTE_TYPE_LABEL[type] }))} onChange={(e) => setForm({ ...form, type: e.target.value })} />
      <Select label="Projeto" value={form.project_id} options={[{ value: '', label: 'Sem projeto' }, ...projects.map((project) => ({ value: project.id, label: project.name }))]} onChange={(e) => setForm({ ...form, project_id: e.target.value })} />
      <Select label="Tarefa vinculada" value={form.task_id} options={[{ value: '', label: 'Sem tarefa' }, ...tasks.map((task) => ({ value: task.id, label: task.title }))]} onChange={(e) => setForm({ ...form, task_id: e.target.value })} />
      <Select label="Reunião vinculada" value={form.meeting_id} options={[{ value: '', label: 'Sem reunião' }, ...meetings.map((meeting) => ({ value: meeting.id, label: meeting.title }))]} onChange={(e) => setForm({ ...form, meeting_id: e.target.value })} />
      <div className="sm:col-span-2"><Textarea label="Conteúdo" rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Escreva sem atrito. Título é o único campo obrigatório." /></div>
      {error && <p className="text-xs text-[#ef4444] sm:col-span-2">{error}</p>}
      <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" variant="accent" loading={pending}>{note ? 'Salvar alterações' : 'Criar nota'}</Button></div>
    </form>
  </Modal>
}
