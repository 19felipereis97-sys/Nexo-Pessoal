import { getRoutinesData } from '@/lib/data/routines'
import { RoutinesClient } from '@/components/routines/routines-client'

export const dynamic = 'force-dynamic'

export default async function RoutinesPage() {
  const data = await getRoutinesData()
  return <RoutinesClient data={data} />
}
