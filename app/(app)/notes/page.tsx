import { PageHeader } from '@/components/shared/page-header'
import { ErrorState } from '@/components/ui/error-state'
import { NotesClient } from '@/components/notes/notes-client'
import { getNotesPageData } from '@/lib/data/notes'

export const metadata = { title: 'Anotações – Nexo Pessoal' }

export default async function NotesPage() {
  const { notes, projects, tasks, meetings, error } = await getNotesPageData()
  return <div className="mx-auto flex max-w-[1500px] flex-col gap-4"><PageHeader title="Anotações" description="Capture notas, ideias, decisões e registros sem perder o vínculo com a execução" />{error ? <ErrorState title="Erro ao carregar notas" message={error} /> : <NotesClient initialNotes={notes} projects={projects} tasks={tasks} meetings={meetings} />}</div>
}
