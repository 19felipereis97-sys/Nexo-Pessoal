'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarCheck, CalendarX, CheckSquare, Clock, ExternalLink, FileText, FolderOpen, Lightbulb, MapPin, Pencil, Plus, Search, Trash2, Users, Video } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Drawer } from '@/components/ui/drawer'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip } from '@/components/ui/tooltip'
import { TaskFormModal } from '@/components/tasks/task-form-modal'
import { createTask, type CreateTaskInput } from '@/lib/actions/tasks'
import { createMeetingDecision, deleteMeeting, updateMeeting, type MeetingInput } from '@/lib/actions/meetings'
import type { MeetingItem } from '@/lib/data/meetings'
import type { Project } from '@/lib/supabase/types'
import { MeetingFormModal } from './meeting-form-modal'
import { MEETING_STATUS_LABEL, MEETING_STATUS_TOOLTIP, MEETING_STATUS_VARIANT } from './constants'

const when = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })

export function MeetingsClient({ initialMeetings, projects }: { initialMeetings: MeetingItem[]; projects: Project[] }) {
  const router = useRouter()
  const [meetings, setMeetings] = useState(initialMeetings)
  const [selected, setSelected] = useState<MeetingItem | null>(null)
  const [editing, setEditing] = useState<MeetingItem | null | undefined>(undefined)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<MeetingItem | null>(null)
  const [search, setSearch] = useState('')
  const visible = useMemo(() => meetings.filter((meeting) => meeting.title.toLowerCase().includes(search.toLowerCase()) || meeting.project?.name.toLowerCase().includes(search.toLowerCase())), [meetings, search])
  const refresh = () => router.refresh()

  function saved() { setSelected(null); refresh() }
  function removed(id: string) { setMeetings((items) => items.filter((item) => item.id !== id)); setSelected(null); setDeleting(null); refresh() }

  return <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-3 rounded-xl border border-[#262626] bg-[#0d0d0d] p-3 sm:flex-row">
      <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#525252]" /><Input aria-label="Buscar reuniões" className="pl-9" placeholder="Buscar por reunião ou projeto..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <Button variant="accent" size="sm" onClick={() => setCreating(true)}><Plus className="h-3.5 w-3.5" /> Nova reunião</Button>
    </div>
    {visible.length === 0 ? <EmptyState icon={<Video className="h-5 w-5" />} title="Nenhuma reunião encontrada" description="Crie uma reunião para preparar pauta, registrar decisões e gerar tarefas." action={{ label: 'Criar reunião', onClick: () => setCreating(true) }} /> :
      <div className="grid gap-3 lg:grid-cols-2">{visible.map((meeting) => <MeetingCard key={meeting.id} meeting={meeting} onOpen={() => setSelected(meeting)} onEdit={() => setEditing(meeting)} onDelete={() => setDeleting(meeting)} />)}</div>}

    <MeetingDrawer key={selected?.id ?? 'closed'} meeting={selected} projects={projects} onClose={() => setSelected(null)} onEdit={(meeting) => setEditing(meeting)} onDelete={(meeting) => setDeleting(meeting)} onSaved={saved} />
    <MeetingFormModal key={creating ? 'create-open' : 'create-closed'} open={creating} projects={projects} onClose={() => setCreating(false)} onSaved={saved} />
    <MeetingFormModal key={editing?.id ?? 'edit-closed'} open={!!editing} meeting={editing} projects={projects} onClose={() => setEditing(undefined)} onSaved={saved} />
    <DeleteMeetingModal meeting={deleting} onClose={() => setDeleting(null)} onDeleted={removed} />
  </div>
}

function MeetingCard({ meeting, onOpen, onEdit, onDelete }: { meeting: MeetingItem; onOpen: () => void; onEdit: () => void; onDelete: () => void }) {
  const stop = (event: React.MouseEvent, action: () => void) => { event.stopPropagation(); action() }
  return <article onClick={onOpen} className="nexo-hover cursor-pointer rounded-xl border border-[#262626] bg-[#0d0d0d] p-4">
    <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#262626] bg-[#111]"><Video className="h-4 w-4 text-[#c9a227]" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-sm font-medium text-[#f5f5f5]">{meeting.title}</h2><Tooltip content={MEETING_STATUS_TOOLTIP[meeting.status]}><span><Badge variant={MEETING_STATUS_VARIANT[meeting.status]}>{MEETING_STATUS_LABEL[meeting.status]}</Badge></span></Tooltip></div><p className="mt-1 text-xs text-[#737373]">{when(meeting.scheduled_at)} · {meeting.duration_minutes} min</p><p className="mt-1 text-xs text-[#525252]">{meeting.project?.name ?? 'Sem projeto'} · {meeting.participants.length} participante(s)</p></div></div>
    <div className="mt-4 flex items-center justify-between border-t border-[#1f1f1f] pt-3"><span className={`flex items-center gap-1 text-xs ${meeting.hasCalendarEvent ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>{meeting.hasCalendarEvent ? <CalendarCheck className="h-3.5 w-3.5" /> : <CalendarX className="h-3.5 w-3.5" />}{meeting.hasCalendarEvent ? 'Na agenda' : 'Sem evento'}</span><span className="flex gap-1"><Button aria-label="Editar reunião" size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => stop(e, onEdit)}><Pencil className="h-3.5 w-3.5" /></Button><Button aria-label="Excluir reunião" size="icon" variant="ghost" className="h-7 w-7 text-[#ef4444]" onClick={(e) => stop(e, onDelete)}><Trash2 className="h-3.5 w-3.5" /></Button></span></div>
  </article>
}

function MeetingDrawer({ meeting, projects, onClose, onEdit, onDelete, onSaved }: { meeting: MeetingItem | null; projects: Project[]; onClose: () => void; onEdit: (meeting: MeetingItem) => void; onDelete: (meeting: MeetingItem) => void; onSaved: () => void }) {
  const [taskOpen, setTaskOpen] = useState(false)
  const [decisionOpen, setDecisionOpen] = useState(false)
  const [minutes, setMinutes] = useState(meeting?.minutes ?? '')
  const [nextSteps, setNextSteps] = useState(meeting?.next_steps ?? '')
  const [pending, startTransition] = useTransition()
  if (!meeting) return null
  const current = meeting
  const input = (): MeetingInput => ({ title: current.title, description: current.description ?? '', project_id: current.project_id ?? '', scheduled_at: current.scheduled_at, duration_minutes: current.duration_minutes, location: current.location ?? '', participants: current.participants, agenda: current.agenda ?? '', minutes, next_steps: nextSteps, status: current.status })
  function saveNotes() { startTransition(async () => { const result = await updateMeeting(current.id, input()); if (!result.error) onSaved() }) }
  async function createGeneratedTask(task: CreateTaskInput) { const result = await createTask({ ...task, project_id: current.project_id ?? undefined, meeting_id: current.id }); if (result.error) throw new Error(result.error); onSaved() }
  return <Drawer open onClose={onClose} title={meeting.title} description={`${when(meeting.scheduled_at)} · ${meeting.duration_minutes} min`} width="w-full sm:w-[760px]">
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2"><Tooltip content={MEETING_STATUS_TOOLTIP[meeting.status]}><span><Badge variant={MEETING_STATUS_VARIANT[meeting.status]}>{MEETING_STATUS_LABEL[meeting.status]}</Badge></span></Tooltip><Button size="sm" variant="secondary" onClick={() => onEdit(meeting)}><Pencil className="h-3.5 w-3.5" /> Editar dados</Button><Tooltip content="Cria uma tarefa vinculada à reunião e envia ao módulo de tarefas"><span><Button size="sm" variant="accent" onClick={() => setTaskOpen(true)}><CheckSquare className="h-3.5 w-3.5" /> Gerar tarefa</Button></span></Tooltip><Button size="sm" variant="danger" onClick={() => onDelete(meeting)}><Trash2 className="h-3.5 w-3.5" /> Excluir</Button></div>
      <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
        <div className="flex flex-col gap-5">
          <Panel title="Pauta" icon={<FileText className="h-4 w-4" />}><p className="whitespace-pre-wrap text-sm leading-relaxed text-[#a3a3a3]">{meeting.agenda || 'Sem pauta registrada.'}</p></Panel>
          <Panel title="Ata" icon={<FileText className="h-4 w-4" />}><Textarea aria-label="Ata da reunião" rows={10} placeholder="Registre uma ata clara e objetiva..." value={minutes} onChange={(e) => setMinutes(e.target.value)} /><div className="mt-3 flex justify-end"><Button size="sm" variant="accent" loading={pending} onClick={saveNotes}>Salvar ata</Button></div></Panel>
          <Panel title="Decisões" icon={<Lightbulb className="h-4 w-4" />} action={<Button size="sm" variant="secondary" onClick={() => setDecisionOpen(true)}><Plus className="h-3.5 w-3.5" /> Decisão</Button>}>{meeting.decisions.length ? <div className="grid gap-2 sm:grid-cols-2">{meeting.decisions.map((decision) => <div key={decision.id} className="rounded-lg border border-[#c9a227]/20 bg-[#c9a227]/5 p-3"><p className="text-sm font-medium text-[#e5e5e5]">{decision.title}</p>{decision.description && <p className="mt-1 text-xs text-[#737373]">{decision.description}</p>}</div>)}</div> : <EmptyState title="Nenhuma decisão registrada" className="py-7" />}</Panel>
          <Panel title="Próximos passos" icon={<CheckSquare className="h-4 w-4" />}><Textarea rows={5} value={nextSteps} onChange={(e) => setNextSteps(e.target.value)} placeholder="Responsáveis, prazos e acompanhamentos..." /><div className="mt-3 flex justify-end"><Button size="sm" variant="secondary" loading={pending} onClick={saveNotes}>Salvar próximos passos</Button></div></Panel>
          <Panel title="Tarefas geradas" icon={<CheckSquare className="h-4 w-4" />} count={meeting.generatedTasks.length}>{meeting.generatedTasks.length ? <div className="divide-y divide-[#1f1f1f]">{meeting.generatedTasks.map((task) => <div key={task.id} className="flex items-center justify-between py-2 text-sm"><span className="text-[#a3a3a3]">{task.title}</span><Badge variant={task.status === 'concluida' ? 'success' : 'muted'}>{task.status}</Badge></div>)}</div> : <EmptyState title="Nenhuma tarefa gerada" className="py-7" />}</Panel>
        </div>
        <aside className="flex flex-col gap-3">
          <Tooltip content="Projeto ao qual decisões e tarefas desta reunião serão vinculadas" side="left"><div className="rounded-xl border border-[#c9a227]/20 bg-[#c9a227]/5 p-4"><p className="flex items-center gap-2 text-xs uppercase tracking-wide text-[#c9a227]"><FolderOpen className="h-3.5 w-3.5" /> Projeto vinculado</p><p className="mt-2 text-sm font-medium text-[#f5f5f5]">{meeting.project?.name ?? 'Sem projeto'}</p><p className="mt-1 text-xs text-[#737373]">{meeting.project?.description ?? 'Sem descrição.'}</p></div></Tooltip>
          <Info icon={<MapPin className="h-3.5 w-3.5" />} label="Local ou link" value={meeting.location ?? 'Não informado'} />
          <Info icon={<Users className="h-3.5 w-3.5" />} label="Participantes" value={meeting.participants.join(', ') || 'Não informados'} />
          <Info icon={<Clock className="h-3.5 w-3.5" />} label="Duração" value={`${meeting.duration_minutes} minutos`} />
          {meeting.location?.startsWith('http') && <Button size="sm" variant="secondary" onClick={() => window.open(meeting.location!, '_blank', 'noopener,noreferrer')}><ExternalLink className="h-3.5 w-3.5" /> Abrir link</Button>}
        </aside>
      </div>
      <TaskFormModal key={String(taskOpen)} open={taskOpen} projects={projects.map((p) => ({ id: p.id, name: p.name }))} defaultProjectId={meeting.project_id ?? undefined} onClose={() => setTaskOpen(false)} onSubmit={createGeneratedTask} />
      <DecisionModal open={decisionOpen} meetingId={meeting.id} onClose={() => setDecisionOpen(false)} onSaved={onSaved} />
    </div>
  </Drawer>
}

function Panel({ title, icon, action, count, children }: { title: string; icon: React.ReactNode; action?: React.ReactNode; count?: number; children: React.ReactNode }) { return <section className="rounded-xl border border-[#262626] bg-[#0d0d0d] p-4"><header className="mb-3 flex items-center gap-2 text-sm font-medium text-[#f5f5f5]">{icon}{title}{count !== undefined && <Badge variant="muted">{count}</Badge>}<span className="ml-auto">{action}</span></header>{children}</section> }
function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-xl border border-[#262626] bg-[#0d0d0d] p-3"><p className="flex items-center gap-1.5 text-xs text-[#525252]">{icon}{label}</p><p className="mt-1 break-words text-xs text-[#a3a3a3]">{value}</p></div> }

function DecisionModal({ open, meetingId, onClose, onSaved }: { open: boolean; meetingId: string; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [error, setError] = useState(''); const [pending, startTransition] = useTransition()
  function submit(event: React.FormEvent) { event.preventDefault(); startTransition(async () => { const result = await createMeetingDecision(meetingId, title, description); if (result.error) return setError(result.error); onSaved(); onClose() }) }
  return <Modal open={open} onClose={onClose} title="Registrar decisão"><form onSubmit={submit} className="flex flex-col gap-4"><Input label="Decisão *" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus /><Textarea label="Contexto" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />{error && <p className="text-xs text-[#ef4444]">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" variant="accent" loading={pending}>Registrar decisão</Button></div></form></Modal>
}

function DeleteMeetingModal({ meeting, onClose, onDeleted }: { meeting: MeetingItem | null; onClose: () => void; onDeleted: (id: string) => void }) {
  const [pending, startTransition] = useTransition(); const [error, setError] = useState('')
  function remove(removeEvent: boolean) { if (!meeting) return; startTransition(async () => { const result = await deleteMeeting(meeting.id, removeEvent); if (result.error) return setError(result.error); onDeleted(meeting.id) }) }
  return <Modal open={!!meeting} onClose={onClose} title="Excluir reunião" description="Escolha o que fazer com o compromisso da agenda."><p className="mb-4 text-sm text-[#a3a3a3]">Confirma a exclusão de <strong className="text-[#f5f5f5]">{meeting?.title}</strong>?</p>{error && <p className="mb-3 text-xs text-[#ef4444]">{error}</p>}<div className="flex flex-col gap-2"><Button variant="danger" loading={pending} onClick={() => remove(true)}><CalendarX className="h-4 w-4" /> Excluir reunião e evento</Button><Button variant="secondary" disabled={pending} onClick={() => remove(false)}><CalendarCheck className="h-4 w-4" /> Excluir reunião e manter evento</Button><Button variant="ghost" disabled={pending} onClick={onClose}>Cancelar</Button></div></Modal>
}
