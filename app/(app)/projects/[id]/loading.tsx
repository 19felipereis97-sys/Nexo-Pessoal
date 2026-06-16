import { LoadingState } from '@/components/ui/loading-state'

export default function ProjectDetailLoading() {
  return <LoadingState message="Carregando detalhes do projeto..." className="min-h-[50vh]" />
}
