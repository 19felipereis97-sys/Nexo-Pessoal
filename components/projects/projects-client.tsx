'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Archive, Grid2X2, List, Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Tooltip } from '@/components/ui/tooltip'
import { deleteProject, setProjectArchived } from '@/lib/actions/projects'
import type { ProjectSummary } from '@/lib/data/projects'
import { ProjectFormModal } from './project-form-modal'
import { PROJECT_PRIORITY_LABEL, PROJECT_STATUS_LABEL, PROJECT_STATUS_VARIANT } from './constants'

const date = (value: string | null) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : 'Sem prazo'

export function ProjectsClient({ initialProjects }: { initialProjects: ProjectSummary[] }) {
  const router = useRouter()
  const [projects, setProjects] = useState(initialProjects)
  const [view, setView] = useState<'cards' | 'list'>('cards')
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [editing, setEditing] = useState<ProjectSummary | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<ProjectSummary | null>(null)
  const [pending, startTransition] = useTransition()

  const visible = useMemo(() => projects.filter((project) =>
    (showArchived ? project.status === 'arquivado' : project.status !== 'arquivado') &&
    project.name.toLowerCase().includes(search.toLowerCase()),
  ), [projects, search, showArchived])

  function refresh() {
    router.refresh()
  }

  function archive(project: ProjectSummary, archived: boolean) {
    startTransition(async () => {
      const result = await setProjectArchived(project.id, archived)
      if (!result.error) {
        setProjects((items) => items.map((item) => item.id === project.id ? { ...item, status: archived ? 'arquivado' : 'em-andamento' } : item))
        refresh()
      }
    })
  }

  function remove() {
    if (!deleting) return
    startTransition(async () => {
      const result = await deleteProject(deleting.id)
      if (!result.error) {
        setProjects((items) => items.filter((item) => item.id !== deleting.id))
        setDeleting(null)
        refresh()
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-[#262626] bg-[#0d0d0d] p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#525252]" />
          <Input aria-label="Buscar projetos" placeholder="Buscar projetos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button size="sm" variant={showArchived ? 'accent' : 'secondary'} onClick={() => setShowArchived(!showArchived)}>
          <Archive className="h-3.5 w-3.5" /> {showArchived ? 'Ver ativos' : 'Arquivados'}
        </Button>
        <div className="flex rounded-lg border border-[#262626] p-0.5">
          <Button aria-label="Visualizar cards" size="icon" variant={view === 'cards' ? 'secondary' : 'ghost'} onClick={() => setView('cards')} className="h-7 w-7"><Grid2X2 className="h-3.5 w-3.5" /></Button>
          <Button aria-label="Visualizar lista" size="icon" variant={view === 'list' ? 'secondary' : 'ghost'} onClick={() => setView('list')} className="h-7 w-7"><List className="h-3.5 w-3.5" /></Button>
        </div>
        <Button size="sm" variant="accent" onClick={() => setEditing(null)}><Plus className="h-3.5 w-3.5" /> Novo projeto</Button>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={<Grid2X2 className="h-5 w-5" />} title={showArchived ? 'Nenhum projeto arquivado' : 'Nenhum projeto encontrado'}
          description="Crie um projeto para organizar tarefas, agenda e conhecimento."
          action={!showArchived ? { label: 'Criar projeto', onClick: () => setEditing(null) } : undefined} />
      ) : view === 'cards' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((project) => <ProjectCard key={project.id} project={project} onOpen={() => router.push(`/projects/${project.id}`)}
            onEdit={() => setEditing(project)} onArchive={() => archive(project, project.status !== 'arquivado')} onDelete={() => setDeleting(project)} />)}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#262626]">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-[#111] text-[#737373]"><tr><th className="p-3">Projeto</th><th>Status</th><th>Prioridade</th><th>Progresso</th><th>Prazo</th><th className="pr-3 text-right">Ações</th></tr></thead>
            <tbody>{visible.map((project) => <tr key={project.id} onClick={() => router.push(`/projects/${project.id}`)} className="cursor-pointer border-t border-[#1f1f1f] hover:bg-[#0d0d0d]">
              <td className="p-3 font-medium text-[#f5f5f5]">{project.name}</td><td><Badge variant={PROJECT_STATUS_VARIANT[project.status]}>{PROJECT_STATUS_LABEL[project.status]}</Badge></td>
              <td>{PROJECT_PRIORITY_LABEL[project.priority] ?? project.priority}</td><td>{project.computedProgress}% ({project.taskDone}/{project.taskTotal})</td><td>{date(project.due_date)}</td>
              <td className="pr-3 text-right"><ProjectActions project={project} onEdit={() => setEditing(project)} onArchive={() => archive(project, project.status !== 'arquivado')} onDelete={() => setDeleting(project)} /></td>
            </tr>)}</tbody>
          </table>
        </div>
      )}

      <ProjectFormModal key={editing?.id ?? String(editing)} open={editing !== undefined} project={editing} onClose={() => setEditing(undefined)} onSaved={refresh} />
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Excluir projeto" description="Os vínculos serão removidos das tarefas, eventos, reuniões e notas.">
        <p className="mb-5 text-sm text-[#a3a3a3]">Confirma a exclusão de <strong className="text-[#f5f5f5]">{deleting?.name}</strong>?</p>
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setDeleting(null)}>Cancelar</Button><Button variant="danger" loading={pending} onClick={remove}>Excluir projeto</Button></div>
      </Modal>
    </div>
  )
}

function ProjectCard({ project, onOpen, onEdit, onArchive, onDelete }: { project: ProjectSummary; onOpen: () => void; onEdit: () => void; onArchive: () => void; onDelete: () => void }) {
  return <article onClick={onOpen} className="nexo-hover cursor-pointer rounded-xl border border-[#262626] bg-[#0d0d0d] p-4">
    <div className="mb-3 flex items-start justify-between gap-2"><div><h2 className="font-medium text-[#f5f5f5]">{project.name}</h2><p className="mt-1 line-clamp-2 text-xs text-[#737373]">{project.description || 'Sem descrição'}</p></div><Badge variant={PROJECT_STATUS_VARIANT[project.status]}>{PROJECT_STATUS_LABEL[project.status]}</Badge></div>
    {(project.isStale || project.overdueTasks > 0) && <div className="mb-3 flex flex-wrap gap-2">
      {project.isStale && <Badge variant="warning"><AlertTriangle className="h-3 w-3" /> Sem movimentação</Badge>}
      {project.overdueTasks > 0 && <Badge variant="danger"><AlertTriangle className="h-3 w-3" /> {project.overdueTasks} vencida(s)</Badge>}
    </div>}
    <Tooltip content="Progresso calculado automaticamente pelas tarefas concluídas" className="w-full"><div className="w-full"><div className="mb-1 flex justify-between text-xs text-[#737373]"><span>{project.taskDone}/{project.taskTotal} tarefas</span><span>{project.computedProgress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#262626]"><div className="h-full bg-[#c9a227]" style={{ width: `${project.computedProgress}%` }} /></div></div></Tooltip>
    <div className="mt-4 flex items-center justify-between border-t border-[#1f1f1f] pt-3 text-xs text-[#737373]"><span>{PROJECT_PRIORITY_LABEL[project.priority]}</span><span>{date(project.due_date)}</span><ProjectActions project={project} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} /></div>
  </article>
}

function ProjectActions({ project, onEdit, onArchive, onDelete }: { project: ProjectSummary; onEdit: () => void; onArchive: () => void; onDelete: () => void }) {
  const action = (event: React.MouseEvent, fn: () => void) => { event.stopPropagation(); fn() }
  return <span className="inline-flex gap-1">
    <Button aria-label="Editar projeto" size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => action(e, onEdit)}><Pencil className="h-3.5 w-3.5" /></Button>
    <Button aria-label={project.status === 'arquivado' ? 'Reativar projeto' : 'Arquivar projeto'} size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => action(e, onArchive)}>{project.status === 'arquivado' ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}</Button>
    <Button aria-label="Excluir projeto" size="icon" variant="ghost" className="h-7 w-7 text-[#ef4444]" onClick={(e) => action(e, onDelete)}><Trash2 className="h-3.5 w-3.5" /></Button>
  </span>
}
