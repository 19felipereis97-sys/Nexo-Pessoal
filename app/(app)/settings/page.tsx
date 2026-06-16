import { getSettingsData } from '@/lib/data/settings'
import { SettingsClient } from '@/components/settings/settings-client'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const data = await getSettingsData()
  return <SettingsClient data={data} />
}
