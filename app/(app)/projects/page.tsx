import { PageHeader } from '@/components/shared/page-header'
import { ErrorState } from '@/components/ui/error-state'
import { ProjectsClient } from '@/components/projects/projects-client'
import { getProjectsPageData } from '@/lib/data/projects'

export const metadata = { title: 'Projetos – Nexo Pessoal' }

export default async function ProjectsPage() {
  const { projects, error } = await getProjectsPageData()
  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
      <PageHeader title="Projetos" description="Conecte execução, agenda e conhecimento em um só lugar" />
      {error ? <ErrorState title="Erro ao carregar projetos" message={error} /> : <ProjectsClient initialProjects={projects} />}
    </div>
  )
}
