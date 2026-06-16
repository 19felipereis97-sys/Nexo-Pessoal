'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Cloud, File, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { saveDocument } from '@/lib/actions/documents'
import { buildStoragePath, DOCUMENT_CATEGORIES, fileNameToTitle, formatFileSize, validateFile } from '@/lib/utils/documents'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Project, Task, Meeting, Note } from '@/lib/supabase/types'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  projects: Array<Pick<Project, 'id' | 'name'>>
  tasks: Array<Pick<Task, 'id' | 'title'>>
  meetings: Array<Pick<Meeting, 'id' | 'title'>>
  notes: Array<Pick<Note, 'id' | 'title'>>
}

interface FormState {
  title: string
  description: string
  category: string
  tags: string
  projectId: string
  taskId: string
  meetingId: string
  noteId: string
}

export function DocumentUploadModal({ open, onClose, onSaved, projects, tasks, meetings, notes }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({
    title: '', description: '', category: '', tags: '',
    projectId: '', taskId: '', meetingId: '', noteId: '',
  })

  function handleFileSelect(selected: File) {
    const err = validateFile(selected)
    if (err) { setFileError(err); setFile(null); return }
    setFileError(null)
    setFile(selected)
    setForm((f) => ({ ...f, title: fileNameToTitle(selected.name) }))
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFileSelect(dropped)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function resetAll() {
    setFile(null); setFileError(null); setProgress(0); setUploading(false)
    setError(null); setDragging(false)
    setForm({ title: '', description: '', category: '', tags: '', projectId: '', taskId: '', meetingId: '', noteId: '' })
  }

  function handleClose() { if (uploading) return; resetAll(); onClose() }

  function field(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !form.title.trim()) return

    setError(null)
    setUploading(true)
    setProgress(0)

    const docId = crypto.randomUUID()

    // Simulate progress while upload is in-flight
    let fake = 0
    const interval = setInterval(() => {
      fake = Math.min(fake + Math.random() * 8 + 2, 85)
      setProgress(Math.round(fake))
    }, 300)

    try {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const realPath = buildStoragePath(user.id, docId, file.name)

      const { error: uploadError } = await sb.storage.from('documents').upload(realPath, file, { upsert: false })
      if (uploadError) throw new Error(uploadError.message)

      clearInterval(interval)
      setProgress(100)

      const tags = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : []

      const res = await saveDocument({
        id: docId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        file_name: file.name,
        file_path: realPath,
        file_type: file.name.split('.').pop()?.toLowerCase(),
        file_size: file.size,
        category: form.category || undefined,
        tags: tags.length ? tags : undefined,
        project_id: form.projectId || null,
        task_id: form.taskId || null,
        meeting_id: form.meetingId || null,
        note_id: form.noteId || null,
      })

      if (res.error) throw new Error(res.error)

      router.refresh()
      setTimeout(() => { resetAll(); onSaved() }, 400)
    } catch (err) {
      clearInterval(interval)
      setError(err instanceof Error ? err.message : 'Erro ao enviar documento')
      setProgress(0)
      setUploading(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Upload de documento" size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Drop zone */}
        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors ${
              dragging ? 'border-[#c9a227] bg-[#c9a227]/5' : 'border-[#333] hover:border-[#555] hover:bg-[#0a0a0a]'
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#262626] bg-[#0d0d0d]">
              <Cloud className="h-5 w-5 text-[#737373]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[#f5f5f5]">Arraste um arquivo ou clique para selecionar</p>
              <p className="mt-1 text-xs text-[#737373]">PDF, DOC, DOCX, XLS, XLSX, CSV, TXT, PNG, JPG, WEBP · Máx. 50 MB</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-[#262626] bg-[#0d0d0d] p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#262626] bg-[#111]">
              <File className="h-4 w-4 text-[#c9a227]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-[#f5f5f5]">{file.name}</p>
              <p className="text-xs text-[#737373]">{formatFileSize(file.size)}</p>
            </div>
            {!uploading && (
              <Button type="button" variant="ghost" size="icon" onClick={() => { setFile(null); setFileError(null) }}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {fileError && <p className="rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/10 p-2 text-xs text-[#ef4444]">{fileError}</p>}

        {/* Progress bar */}
        {uploading && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-[#737373]">
              <span>{progress < 100 ? 'Enviando…' : 'Concluído!'}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#262626]">
              <div
                className="h-full rounded-full bg-[#c9a227] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {file && !uploading && (
          <>
            <div className="border-t border-[#1f1f1f] pt-2" />

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a3a3a3]">Título *</label>
              <Input value={form.title} onChange={field('title')} placeholder="Título do documento" required />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a3a3a3]">Descrição</label>
              <Textarea value={form.description} onChange={field('description')} placeholder="Descreva o documento…" rows={2} />
            </div>

            {/* Category + Tags */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#a3a3a3]">Categoria</label>
                <select
                  value={form.category}
                  onChange={field('category')}
                  className="w-full rounded-lg border border-[#262626] bg-[#0d0d0d] px-3 py-2 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227] transition-colors"
                >
                  <option value="">Sem categoria</option>
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#a3a3a3]">Tags (vírgula)</label>
                <Input value={form.tags} onChange={field('tags')} placeholder="ex: relatório, 2026" />
              </div>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#a3a3a3]">Projeto</label>
                <select value={form.projectId} onChange={field('projectId')} className="w-full rounded-lg border border-[#262626] bg-[#0d0d0d] px-3 py-2 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227] transition-colors">
                  <option value="">—</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#a3a3a3]">Tarefa</label>
                <select value={form.taskId} onChange={field('taskId')} className="w-full rounded-lg border border-[#262626] bg-[#0d0d0d] px-3 py-2 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227] transition-colors">
                  <option value="">—</option>
                  {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#a3a3a3]">Reunião</label>
                <select value={form.meetingId} onChange={field('meetingId')} className="w-full rounded-lg border border-[#262626] bg-[#0d0d0d] px-3 py-2 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227] transition-colors">
                  <option value="">—</option>
                  {meetings.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#a3a3a3]">Nota</label>
                <select value={form.noteId} onChange={field('noteId')} className="w-full rounded-lg border border-[#262626] bg-[#0d0d0d] px-3 py-2 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227] transition-colors">
                  <option value="">—</option>
                  {notes.map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
                </select>
              </div>
            </div>
          </>
        )}

        {error && <p className="rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/10 p-2 text-xs text-[#ef4444]">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-[#1f1f1f] pt-4">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={uploading}>Cancelar</Button>
          <Button type="submit" variant="accent" disabled={!file || !form.title.trim() || uploading}>
            {uploading ? `Enviando ${progress}%…` : 'Enviar documento'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
