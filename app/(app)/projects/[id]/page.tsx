import { notFound } from 'next/navigation'
import { ErrorState } from '@/components/ui/error-state'
import { ProjectDetailClient } from '@/components/projects/project-detail-client'
import { getProjectDetailData } from '@/lib/data/projects'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getProjectDetailData(id)
  if (!data.project && !data.error) notFound()
  if (data.error) return <ErrorState title="Erro ao carregar projeto" message={data.error} />
  return <ProjectDetailClient data={data} />
}
