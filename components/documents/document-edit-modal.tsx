'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateDocument, type UpdateDocumentInput } from '@/lib/actions/documents'
import { DOCUMENT_CATEGORIES } from '@/lib/utils/documents'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Project, Task, Meeting, Note } from '@/lib/supabase/types'
import type { DocumentWithRefs } from '@/lib/data/documents'

interface Props {
  open: boolean
  document: DocumentWithRefs | null
  onClose: () => void
  onSaved: () => void
  projects: Array<Pick<Project, 'id' | 'name'>>
  tasks: Array<Pick<Task, 'id' | 'title'>>
  meetings: Array<Pick<Meeting, 'id' | 'title'>>
  notes: Array<Pick<Note, 'id' | 'title'>>
}

export function DocumentEditModal({ open, document, onClose, onSaved, projects, tasks, meetings, notes }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [projectId, setProjectId] = useState('')
  const [taskId, setTaskId] = useState('')
  const [meetingId, setMeetingId] = useState('')
  const [noteId, setNoteId] = useState('')

  useEffect(() => {
    if (!document) return
    const timer = setTimeout(() => {
      setTitle(document.title)
      setDescription(document.description ?? '')
      setCategory(document.category ?? '')
      setTags(document.tags?.join(', ') ?? '')
      setProjectId(document.project_id ?? '')
      setTaskId(document.task_id ?? '')
      setMeetingId(document.meeting_id ?? '')
      setNoteId(document.note_id ?? '')
      setError(null)
    }, 0)
    return () => clearTimeout(timer)
  }, [document])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!document || !title.trim()) return
    setSaving(true)
    setError(null)

    const parsedTags = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : []
    const input: UpdateDocumentInput = {
      title: title.trim(),
      description: description.trim(),
      category: category || undefined,
      tags: parsedTags.length ? parsedTags : [],
      project_id: projectId || null,
      task_id: taskId || null,
      meeting_id: meetingId || null,
      note_id: noteId || null,
    }

    const res = await updateDocument(document.id, input)
    setSaving(false)
    if (res.error) { setError(res.error); return }
    router.refresh()
    onSaved()
  }

  return (
    <Modal key={document?.id ?? 'none'} open={open} onClose={onClose} title="Editar documento" size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#a3a3a3]">Título *</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do documento" required />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#a3a3a3]">Descrição</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o documento…" rows={2} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#a3a3a3]">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-[#262626] bg-[#0d0d0d] px-3 py-2 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227] transition-colors"
            >
              <option value="">Sem categoria</option>
              {DOCUMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#a3a3a3]">Tags (vírgula)</label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ex: relatório, 2026" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#a3a3a3]">Projeto</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full rounded-lg border border-[#262626] bg-[#0d0d0d] px-3 py-2 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227] transition-colors">
              <option value="">—</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#a3a3a3]">Tarefa</label>
            <select value={taskId} onChange={(e) => setTaskId(e.target.value)} className="w-full rounded-lg border border-[#262626] bg-[#0d0d0d] px-3 py-2 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227] transition-colors">
              <option value="">—</option>
              {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#a3a3a3]">Reunião</label>
            <select value={meetingId} onChange={(e) => setMeetingId(e.target.value)} className="w-full rounded-lg border border-[#262626] bg-[#0d0d0d] px-3 py-2 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227] transition-colors">
              <option value="">—</option>
              {meetings.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#a3a3a3]">Nota</label>
            <select value={noteId} onChange={(e) => setNoteId(e.target.value)} className="w-full rounded-lg border border-[#262626] bg-[#0d0d0d] px-3 py-2 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227] transition-colors">
              <option value="">—</option>
              {notes.map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/10 p-2 text-xs text-[#ef4444]">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-[#1f1f1f] pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" variant="accent" disabled={!title.trim() || saving}>
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
