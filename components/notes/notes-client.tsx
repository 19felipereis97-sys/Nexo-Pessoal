'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, ArchiveRestore, CheckSquare, FileText, Grid2X2, Lightbulb, List, Pin, PinOff, Plus, Search, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Drawer } from '@/components/ui/drawer'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { PremiumTooltip } from '@/components/ui/premium-tooltip'
import { Select } from '@/components/ui/select'
import type { Meeting, Note, Project, Task } from '@/lib/supabase/types'
import { deleteNote, setNoteArchived, setNotePinned, transformNoteToDecision, transformNoteToTask } from '@/lib/actions/notes'
import { NoteFormModal } from './note-form-modal'
import { NOTE_TYPE_LABEL, NOTE_TYPE_VARIANT, NOTE_TYPES } from './constants'

type ProjectRef = Array<Pick<Project, 'id' | 'name'>>
type TaskRef = Array<Pick<Task, 'id' | 'title' | 'project_id'>>
type MeetingRef = Array<Pick<Meeting, 'id' | 'title' | 'project_id'>>

function preview(content: string, size = 120) {
  const clean = content.replace(/\s+/g, ' ').trim()
  return clean.length > size ? `${clean.slice(0, size)}...` : clean
}

export function NotesClient({ initialNotes, projects, tasks, meetings }: {
  initialNotes: Note[]
  projects: ProjectRef
  tasks: TaskRef
  meetings: MeetingRef
}) {
  const router = useRouter()
  const [notes, setNotes] = useState(initialNotes)
  const [query, setQuery] = useState('')
  const [type, setType] = useState('')
  const [projectId, setProjectId] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [view, setView] = useState<'cards' | 'list'>('cards')
  const [selected, setSelected] = useState<Note | null>(null)
  const [editing, setEditing] = useState<Note | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Note | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const refresh = () => router.refresh()
  const projectMap = useMemo(() => Object.fromEntries(projects.map((project) => [project.id, project.name])), [projects])
  const taskMap = useMemo(() => Object.fromEntries(tasks.map((task) => [task.id, task.title])), [tasks])
  const meetingMap = useMemo(() => Object.fromEntries(meetings.map((meeting) => [meeting.id, meeting.title])), [meetings])
  const filtered = useMemo(() => notes.filter((note) =>
    note.archived === showArchived &&
    (!type || note.type === type) &&
    (!projectId || note.project_id === projectId) &&
    (!query || `${note.title} ${note.content}`.toLowerCase().includes(query.toLowerCase())),
  ).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updated_at.localeCompare(a.updated_at)), [notes, query, type, projectId, showArchived])

  function patch(id: string, next: Partial<Note>) {
    setNotes((items) => items.map((note) => note.id === id ? { ...note, ...next } : note))
    setSelected((note) => note?.id === id ? { ...note, ...next } : note)
  }
  function pin(note: Note) { patch(note.id, { pinned: !note.pinned }); setNotePinned(note.id, !note.pinned).then(refresh) }
  function archive(note: Note) { patch(note.id, { archived: !note.archived, pinned: false }); setNoteArchived(note.id, !note.archived).then(refresh) }
  function remove() { if (!deleting) return; startTransition(async () => { const result = await deleteNote(deleting.id); if (!result.error) { setNotes((items) => items.filter((note) => note.id !== deleting.id)); setSelected(null); setDeleting(null); refresh() } }) }
  function toTask(note: Note) { startTransition(async () => { const result = await transformNoteToTask(note.id); if (result.task) patch(note.id, { converted_task_id: result.task.id, task_id: result.task.id }); refresh() }) }
  function toDecision(note: Note) { startTransition(async () => { const result = await transformNoteToDecision(note.id); if (result.decision) { patch(note.id, { converted_decision_id: result.decision.id, type: 'decisao' }); refresh() } else if (result.error) { setActionError(result.error) } }) }

  return <div className="flex flex-col gap-4">
    {actionError && <div className="flex items-center justify-between rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/5 px-4 py-3 text-sm text-[#ef4444]"><span>{actionError}</span><button onClick={() => setActionError(null)} className="ml-3 shrink-0 opacity-60 hover:opacity-100">✕</button></div>}
    <div className="flex flex-col gap-3 rounded-xl border border-[#262626] bg-[#0d0d0d] p-3 lg:flex-row lg:items-center">
      <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#525252]" /><Input aria-label="Buscar notas" className="pl-9" placeholder="Buscar notas, ideias e decisões..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
      <Select aria-label="Filtrar por tipo" value={type} className="lg:w-48" options={[{ value: '', label: 'Todos os tipos' }, ...NOTE_TYPES.map((item) => ({ value: item, label: NOTE_TYPE_LABEL[item] }))]} onChange={(e) => setType(e.target.value)} />
      <Select aria-label="Filtrar por projeto" value={projectId} className="lg:w-56" options={[{ value: '', label: 'Todos os projetos' }, ...projects.map((project) => ({ value: project.id, label: project.name }))]} onChange={(e) => setProjectId(e.target.value)} />
      <Button size="sm" variant={showArchived ? 'accent' : 'secondary'} onClick={() => setShowArchived(!showArchived)}>{showArchived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}{showArchived ? 'Ver ativas' : 'Arquivadas'}</Button>
      <div className="flex rounded-lg border border-[#262626] p-0.5"><Button aria-label="Visualizar cards" size="icon" variant={view === 'cards' ? 'secondary' : 'ghost'} className="h-7 w-7" onClick={() => setView('cards')}><Grid2X2 className="h-3.5 w-3.5" /></Button><Button aria-label="Visualizar lista" size="icon" variant={view === 'list' ? 'secondary' : 'ghost'} className="h-7 w-7" onClick={() => setView('list')}><List className="h-3.5 w-3.5" /></Button></div>
      <Button size="sm" variant="accent" onClick={() => setEditing(null)}><Plus className="h-3.5 w-3.5" /> Nova nota</Button>
    </div>

    {filtered.length === 0 ? <EmptyState icon={<FileText className="h-5 w-5" />} title={showArchived ? 'Nenhuma nota arquivada' : 'Nenhuma nota encontrada'} description="Capture uma ideia, decisão ou referência para continuar daqui." action={!showArchived ? { label: 'Criar nota', onClick: () => setEditing(null) } : undefined} /> :
      view === 'cards' ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filtered.map((note) => <NoteCard key={note.id} note={note} projectName={note.project_id ? projectMap[note.project_id] : undefined} onOpen={() => setSelected(note)} onPin={() => pin(note)} onArchive={() => archive(note)} onDelete={() => setDeleting(note)} />)}</div> :
      <div className="overflow-x-auto rounded-xl border border-[#262626]"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-[#111] text-[#737373]"><tr><th className="p-3">Nota</th><th>Tipo</th><th>Projeto</th><th>Atualizada</th><th className="pr-3 text-right">Ações</th></tr></thead><tbody>{filtered.map((note) => <tr key={note.id} onClick={() => setSelected(note)} className={`cursor-pointer border-t border-[#1f1f1f] hover:bg-[#0d0d0d] ${note.type === 'decisao' ? 'bg-[#c9a227]/[0.03]' : ''}`}><td className="p-3"><p className="font-medium text-[#f5f5f5]">{note.title}</p><p className="mt-1 truncate text-[#737373]">{preview(note.content, 90)}</p></td><td><Badge variant={NOTE_TYPE_VARIANT[note.type]}>{NOTE_TYPE_LABEL[note.type] ?? note.type}</Badge></td><td>{note.project_id ? projectMap[note.project_id] : 'Sem projeto'}</td><td>{new Date(note.updated_at).toLocaleDateString('pt-BR')}</td><td className="pr-3 text-right"><NoteActions note={note} onPin={() => pin(note)} onArchive={() => archive(note)} onDelete={() => setDeleting(note)} /></td></tr>)}</tbody></table></div>}

    <NoteDrawer note={selected} projectMap={projectMap} taskMap={taskMap} meetingMap={meetingMap} pending={pending} onClose={() => setSelected(null)} onEdit={(note) => setEditing(note)} onPin={pin} onArchive={archive} onDelete={(note) => setDeleting(note)} onTask={toTask} onDecision={toDecision} />
    <NoteFormModal key={editing?.id ?? String(editing)} open={editing !== undefined} note={editing} projects={projects} tasks={tasks} meetings={meetings} onClose={() => setEditing(undefined)} onSaved={(note) => { if (note) setNotes((items) => [note, ...items]); refresh() }} />
    <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Excluir nota" description="Esta ação não remove tarefas ou decisões já geradas."><p className="mb-5 text-sm text-[#a3a3a3]">Confirma a exclusão de <strong className="text-[#f5f5f5]">{deleting?.title}</strong>?</p><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setDeleting(null)}>Cancelar</Button><Button variant="danger" loading={pending} onClick={remove}>Excluir nota</Button></div></Modal>
  </div>
}

function NoteCard({ note, projectName, onOpen, onPin, onArchive, onDelete }: { note: Note; projectName?: string; onOpen: () => void; onPin: () => void; onArchive: () => void; onDelete: () => void }) {
  return <PremiumTooltip title={note.title} content={preview(note.content || 'Sem conteúdo', 180)} className="block"><article onClick={onOpen} className={`nexo-hover cursor-pointer rounded-xl border p-4 ${note.type === 'decisao' ? 'border-[#c9a227]/25 bg-[#c9a227]/5' : note.pinned ? 'border-[#c9a227]/20 bg-[#0d0d0d]' : 'border-[#262626] bg-[#0d0d0d]'}`}><div className="mb-3 flex items-start justify-between gap-2"><div className="min-w-0"><div className="flex items-center gap-2">{note.pinned && <Pin className="h-3 w-3 fill-[#c9a227] text-[#c9a227]" />}<h2 className="line-clamp-2 text-sm font-medium text-[#f5f5f5]">{note.title}</h2></div><p className="mt-1 text-xs text-[#525252]">{projectName ?? 'Sem projeto'}</p></div><Badge variant={NOTE_TYPE_VARIANT[note.type]}>{NOTE_TYPE_LABEL[note.type] ?? note.type}</Badge></div><p className="mb-4 line-clamp-4 text-xs leading-relaxed text-[#737373]">{note.content || 'Sem conteúdo.'}</p><div className="flex items-center justify-between"><span className="text-[10px] text-[#525252]">{new Date(note.updated_at).toLocaleDateString('pt-BR')}</span><NoteActions note={note} onPin={onPin} onArchive={onArchive} onDelete={onDelete} /></div></article></PremiumTooltip>
}

function NoteActions({ note, onPin, onArchive, onDelete }: { note: Note; onPin: () => void; onArchive: () => void; onDelete: () => void }) {
  const act = (event: React.MouseEvent, fn: () => void) => { event.stopPropagation(); fn() }
  return <span className="inline-flex gap-1"><Button aria-label={note.pinned ? 'Desafixar nota' : 'Fixar nota'} size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => act(e, onPin)}>{note.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}</Button><Button aria-label={note.archived ? 'Desarquivar nota' : 'Arquivar nota'} size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => act(e, onArchive)}>{note.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}</Button><Button aria-label="Excluir nota" size="icon" variant="ghost" className="h-7 w-7 text-[#ef4444]" onClick={(e) => act(e, onDelete)}><Trash2 className="h-3.5 w-3.5" /></Button></span>
}

function NoteDrawer({ note, projectMap, taskMap, meetingMap, pending, onClose, onEdit, onPin, onArchive, onDelete, onTask, onDecision }: {
  note: Note | null; projectMap: Record<string, string>; taskMap: Record<string, string>; meetingMap: Record<string, string>; pending: boolean
  onClose: () => void; onEdit: (note: Note) => void; onPin: (note: Note) => void; onArchive: (note: Note) => void; onDelete: (note: Note) => void; onTask: (note: Note) => void; onDecision: (note: Note) => void
}) {
  if (!note) return null
  return <Drawer open onClose={onClose} title="Detalhes da nota" description={NOTE_TYPE_LABEL[note.type] ?? note.type} width="w-full sm:w-[560px]"><div className="flex flex-col gap-5"><div className="flex flex-wrap gap-2"><Badge variant={NOTE_TYPE_VARIANT[note.type]}>{NOTE_TYPE_LABEL[note.type] ?? note.type}</Badge>{note.pinned && <Badge variant="accent">fixada</Badge>}{note.archived && <Badge variant="muted">arquivada</Badge>}</div><div><h2 className="text-lg font-semibold text-[#f5f5f5]">{note.title}</h2><p className="mt-1 text-xs text-[#737373]">Atualizada em {new Date(note.updated_at).toLocaleString('pt-BR')}</p></div><div className="rounded-xl border border-[#262626] bg-[#0d0d0d] p-4"><p className="whitespace-pre-wrap text-sm leading-relaxed text-[#d4d4d4]">{note.content || 'Sem conteúdo.'}</p></div><div className="grid gap-3 sm:grid-cols-3"><Info label="Projeto" value={note.project_id ? projectMap[note.project_id] ?? 'Projeto não encontrado' : 'Sem vínculo'} /><Info label="Tarefa" value={note.task_id ? taskMap[note.task_id] ?? 'Tarefa não encontrada' : 'Sem vínculo'} /><Info label="Reunião" value={note.meeting_id ? meetingMap[note.meeting_id] ?? 'Reunião não encontrada' : 'Sem vínculo'} /></div><div className="flex flex-col gap-2 border-t border-[#262626] pt-4"><div className="grid gap-2 sm:grid-cols-2"><Button variant="accent" loading={pending} onClick={() => onTask(note)} disabled={!!note.converted_task_id}><CheckSquare className="h-4 w-4" />{note.converted_task_id ? 'Tarefa criada' : 'Transformar em tarefa'}</Button><Button variant="secondary" loading={pending} onClick={() => onDecision(note)} disabled={!!note.converted_decision_id}><Lightbulb className="h-4 w-4" />{note.converted_decision_id ? 'Decisão criada' : 'Transformar em decisão'}</Button></div><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => onEdit(note)}>Editar</Button><Button variant="secondary" onClick={() => onPin(note)}>{note.pinned ? 'Desafixar' : 'Fixar'}</Button><Button variant="secondary" onClick={() => onArchive(note)}>{note.archived ? 'Desarquivar' : 'Arquivar'}</Button><Button variant="danger" onClick={() => onDelete(note)}>Excluir</Button></div></div></div></Drawer>
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-[#262626] bg-[#111] p-3"><p className="text-[10px] uppercase tracking-wide text-[#525252]">{label}</p><p className="mt-1 truncate text-xs text-[#a3a3a3]">{value}</p></div> }
