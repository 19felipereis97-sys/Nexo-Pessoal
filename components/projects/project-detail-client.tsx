'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Archive, CalendarDays, CheckSquare, ChevronLeft, Clock, FileText, Lightbulb, Pencil, Plus, RotateCcw, StickyNote, Trash2, Video } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip } from '@/components/ui/tooltip'
import { TaskFormModal } from '@/components/tasks/task-form-modal'
import { EventFormModal } from '@/components/calendar/event-form-modal'
import { createTask, type CreateTaskInput } from '@/lib/actions/tasks'
import { createCalendarEvent, type CreateEventInput } from '@/lib/actions/events'
import { createNote } from '@/lib/actions/notes'
import { deleteProject, setProjectArchived } from '@/lib/actions/projects'
import type { ProjectDetailData } from '@/lib/data/projects'
import { ProjectFormModal } from './project-form-modal'
import { PROJECT_PRIORITY_LABEL, PROJECT_STATUS_LABEL, PROJECT_STATUS_VARIANT } from './constants'

const fullDate = (value: string) => new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const shortDate = (value: string | null) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : 'Sem prazo'

export function ProjectDetailClient({ data }: { data: ProjectDetailData }) {
  const router = useRouter()
  const project = data.project!
  const [taskOpen, setTaskOpen] = useState(false)
  const [eventOpen, setEventOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const projects = [{ id: project.id, name: project.name }]

  const refresh = () => router.refresh()
  async function addTask(input: CreateTaskInput) {
    const result = await createTask({ ...input, project_id: project.id })
    if (result.error) throw new Error(result.error)
    refresh()
  }
  async function addEvent(input: CreateEventInput) {
    const result = await createCalendarEvent({ ...input, project_id: project.id })
    if (result.error) throw new Error(result.error)
    refresh()
  }
  function archive() {
    startTransition(async () => {
      const result = await setProjectArchived(project.id, project.status !== 'arquivado')
      if (!result.error) refresh()
    })
  }
  function remove() {
    startTransition(async () => {
      const result = await deleteProject(project.id)
      if (!result.error) router.push('/projects')
    })
  }

  return <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
    <div>
      <Button variant="ghost" size="sm" onClick={() => router.push('/projects')}><ChevronLeft className="h-4 w-4" /> Projetos</Button>
      <div className="mt-3 flex flex-col gap-4 rounded-2xl border border-[#292720] bg-[#10100f] p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-[#f5f5f5]">{project.name}</h1>
            <Tooltip content="Status atual do ciclo de vida do projeto"><span><Badge variant={PROJECT_STATUS_VARIANT[project.status]}>{PROJECT_STATUS_LABEL[project.status]}</Badge></span></Tooltip>
            <Tooltip content="Prioridade usada para orientar decisões e ordem de execução"><span><Badge variant={project.priority === 'critica' ? 'danger' : project.priority === 'alta' ? 'warning' : 'muted'}>{PROJECT_PRIORITY_LABEL[project.priority]}</Badge></span></Tooltip>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-[#737373]">{project.description || 'Projeto sem descrição.'}</p>
          <p className="mt-3 text-xs text-[#525252]">Início: {shortDate(project.start_date)} · Prazo: {shortDate(project.due_date)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}><Pencil className="h-3.5 w-3.5" /> Editar</Button>
          <Button size="sm" variant="secondary" onClick={archive} disabled={pending}>{project.status === 'arquivado' ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}{project.status === 'arquivado' ? 'Reativar' : 'Arquivar'}</Button>
          <Button aria-label="Excluir projeto" size="icon" variant="danger" onClick={() => setDeleteOpen(true)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>

    {(project.isStale || project.overdueTasks > 0) && <div className="grid gap-3 md:grid-cols-2">
      {project.isStale && <Alert text="Projeto sem movimentação há mais de 14 dias." />}
      {project.overdueTasks > 0 && <Alert danger text={`${project.overdueTasks} tarefa(s) vencida(s) precisam de atenção.`} />}
    </div>}

    <div className="grid gap-4 sm:grid-cols-3">
      <Metric label="Progresso automático" value={`${project.computedProgress}%`} detail={`${project.taskDone} de ${project.taskTotal} tarefas concluídas`} tooltip="Calculado automaticamente pelas tarefas concluídas, desconsiderando canceladas." />
      <Metric label="Agenda vinculada" value={String(data.events.length)} detail="compromissos no projeto" />
      <Metric label="Conhecimento" value={String(data.notes.length + data.decisions.length)} detail="notas e decisões registradas" />
    </div>

    <div className="flex flex-wrap gap-2">
      <Button variant="accent" size="sm" onClick={() => setTaskOpen(true)}><Plus className="h-3.5 w-3.5" /> Criar tarefa</Button>
      <Button variant="secondary" size="sm" onClick={() => setEventOpen(true)}><CalendarDays className="h-3.5 w-3.5" /> Criar compromisso</Button>
      <Button variant="secondary" size="sm" onClick={() => setNoteOpen(true)}><StickyNote className="h-3.5 w-3.5" /> Criar nota</Button>
    </div>

    <Section title="Tarefas vinculadas" icon={<CheckSquare className="h-4 w-4" />} count={data.tasks.length}>
      {data.tasks.length ? <div className="divide-y divide-[#1f1f1f]">{data.tasks.map((task) => <div key={task.id} className="flex items-center justify-between gap-3 py-3 text-sm"><div><p className="text-[#e5e5e5]">{task.title}</p><p className="mt-1 text-xs text-[#525252]">{PROJECT_PRIORITY_LABEL[task.priority] ?? task.priority} · {shortDate(task.due_date)}</p></div><Badge variant={task.status === 'concluida' ? 'success' : 'muted'}>{task.status}</Badge></div>)}</div> :
        <EmptyState title="Nenhuma tarefa vinculada" action={{ label: 'Criar tarefa', onClick: () => setTaskOpen(true) }} />}
    </Section>

    <div className="grid gap-5 xl:grid-cols-2">
      <Section title="Agenda vinculada" icon={<CalendarDays className="h-4 w-4" />} count={data.events.length}>
        <TimelineEmpty items={data.events.map((event) => ({ id: event.id, title: event.title, detail: fullDate(event.start_at), icon: <Clock className="h-3.5 w-3.5" /> }))} empty="Nenhum compromisso vinculado" />
      </Section>
      <Section title="Reuniões vinculadas" icon={<Video className="h-4 w-4" />} count={data.meetings.length}>
        <TimelineEmpty items={data.meetings.map((meeting) => ({ id: meeting.id, title: meeting.title, detail: fullDate(meeting.scheduled_at), icon: <Video className="h-3.5 w-3.5" /> }))} empty="Nenhuma reunião vinculada" />
      </Section>
      <Section title="Notas vinculadas" icon={<StickyNote className="h-4 w-4" />} count={data.notes.length}>
        <TimelineEmpty items={data.notes.map((note) => ({ id: note.id, title: note.title, detail: note.content || 'Nota sem conteúdo', icon: <FileText className="h-3.5 w-3.5" /> }))} empty="Nenhuma nota vinculada" />
      </Section>
      <Section title="Decisões do projeto" icon={<Lightbulb className="h-4 w-4" />} count={data.decisions.length}>
        <TimelineEmpty items={data.decisions.map((decision) => ({ id: decision.id, title: decision.title, detail: decision.description || fullDate(decision.decided_at), icon: <Lightbulb className="h-3.5 w-3.5" /> }))} empty="Nenhuma decisão registrada" />
      </Section>
    </div>

    <TaskFormModal key={taskOpen ? 'project-task-open' : 'project-task-closed'} open={taskOpen} projects={projects} defaultProjectId={project.id} onClose={() => setTaskOpen(false)} onSubmit={addTask} />
    <EventFormModal key={eventOpen ? 'project-event-open' : 'project-event-closed'} open={eventOpen} projects={projects} defaultProjectId={project.id} onClose={() => setEventOpen(false)} onSubmit={addEvent} />
    <QuickNoteModal open={noteOpen} projectId={project.id} onClose={() => setNoteOpen(false)} onSaved={refresh} />
    <ProjectFormModal key={String(editOpen)} open={editOpen} project={project} onClose={() => setEditOpen(false)} onSaved={refresh} />
    <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Excluir projeto"><p className="mb-5 text-sm text-[#a3a3a3]">Esta ação remove o projeto e desvincula seus itens. Deseja continuar?</p><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancelar</Button><Button variant="danger" loading={pending} onClick={remove}>Excluir projeto</Button></div></Modal>
  </div>
}

function Section({ title, icon, count, children }: { title: string; icon: React.ReactNode; count: number; children: React.ReactNode }) {
  return <section className="rounded-xl border border-[#262626] bg-[#0d0d0d] p-4"><header className="mb-2 flex items-center gap-2 text-sm font-medium text-[#f5f5f5]">{icon}{title}<Badge variant="muted">{count}</Badge></header>{children}</section>
}
function Alert({ text, danger }: { text: string; danger?: boolean }) { return <div className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${danger ? 'border-[#ef4444]/20 bg-[#ef4444]/5 text-[#ef4444]' : 'border-[#eab308]/20 bg-[#eab308]/5 text-[#eab308]'}`}><AlertTriangle className="h-4 w-4" />{text}</div> }
function Metric({ label, value, detail, tooltip }: { label: string; value: string; detail: string; tooltip?: string }) {
  const content = <div className="rounded-xl border border-[#262626] bg-[#0d0d0d] p-4"><p className="text-xs text-[#737373]">{label}</p><p className="mt-1 text-2xl font-semibold text-[#f5f5f5]">{value}</p><p className="mt-1 text-xs text-[#525252]">{detail}</p></div>
  return tooltip ? <Tooltip content={tooltip} className="block">{content}</Tooltip> : content
}
function TimelineEmpty({ items, empty }: { items: Array<{ id: string; title: string; detail: string; icon: React.ReactNode }>; empty: string }) {
  return items.length ? <div className="divide-y divide-[#1f1f1f]">{items.map((item) => <div key={item.id} className="flex gap-2 py-3"><span className="mt-0.5 text-[#c9a227]">{item.icon}</span><div className="min-w-0"><p className="text-sm text-[#e5e5e5]">{item.title}</p><p className="mt-1 line-clamp-2 text-xs text-[#525252]">{item.detail}</p></div></div>)}</div> : <EmptyState title={empty} className="py-8" />
}
function QuickNoteModal({ open, projectId, onClose, onSaved }: { open: boolean; projectId: string; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(''); const [content, setContent] = useState(''); const [pending, startTransition] = useTransition(); const [error, setError] = useState('')
  function submit(event: React.FormEvent) { event.preventDefault(); startTransition(async () => { const result = await createNote(title, content, projectId); if (result.error) return setError(result.error); onSaved(); onClose() }) }
  return <Modal open={open} onClose={onClose} title="Nova nota do projeto"><form onSubmit={submit} className="flex flex-col gap-4"><Input label="Título *" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus /><Textarea label="Conteúdo" rows={5} value={content} onChange={(e) => setContent(e.target.value)} />{error && <p className="text-xs text-[#ef4444]">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" variant="accent" loading={pending}>Salvar nota</Button></div></form></Modal>
}
