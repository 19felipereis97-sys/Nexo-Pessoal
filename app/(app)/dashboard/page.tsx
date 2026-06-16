import { getDashboardData } from '@/lib/data/dashboard'
import { getNotificationsData } from '@/lib/data/notifications'
import { DashboardClient } from '@/components/dashboard/dashboard-client'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [data] = await Promise.all([getDashboardData(), getNotificationsData()])

  return (
    <div className="nexo-aura nexo-dashboard-backdrop -m-4 min-h-full p-4 md:-m-6 md:p-6">
      <div className="relative z-10 mx-auto max-w-[1500px]">
        <DashboardClient data={data} />
      </div>
    </div>
  )
}
