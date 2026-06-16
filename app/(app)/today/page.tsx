import { ErrorState } from '@/components/ui/error-state'
import { TodayClient } from '@/components/today/today-client'
import { getTodayData } from '@/lib/data/today'

export const metadata = { title: 'Hoje – Nexo Pessoal' }

export default async function TodayPage() {
  const data = await getTodayData()
  return data.error ? <ErrorState title="Erro ao carregar o dia" message={data.error} /> : <TodayClient initialData={data} />
}
