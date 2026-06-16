import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingState, SkeletonBlock } from '@/components/ui/loading-state'

export default function AssistantLoading() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-4">
      <div>
        <SkeletonBlock className="h-7 w-40" />
        <SkeletonBlock className="mt-2 h-4 w-80" />
      </div>
      <Card elevated>
        <CardHeader>
          <CardTitle>Carregando assistente</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingState message="Analisando tarefas, agenda, projetos e reunioes..." />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonBlock className="h-64" />
        <SkeletonBlock className="h-64" />
      </div>
    </div>
  )
}
