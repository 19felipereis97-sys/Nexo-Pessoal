import { AssistantClient } from '@/components/assistant/assistant-client'
import { getAssistantData, getAIHistory } from '@/lib/data/assistant'

export const dynamic = 'force-dynamic'

export default async function AssistantPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>
}) {
  const resolvedParams = await (searchParams ?? Promise.resolve({} as { q?: string }))
  const [data, history] = await Promise.all([getAssistantData(), getAIHistory(10)])

  return <AssistantClient data={data} initialQuestion={resolvedParams.q} history={history} />
}
