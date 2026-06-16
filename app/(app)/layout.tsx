export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ensureProfile } from '@/lib/auth/actions'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { getNotificationsData } from '@/lib/data/notifications'
import type { Notification, Profile } from '@/lib/supabase/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Auth guard — middleware handles the edge case, this is a defense-in-depth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let profile: Profile | null = null
  let notifications: Notification[] = []
  let unreadCount = 0

  try {
    await ensureProfile(user.id, user.email ?? '', user.user_metadata?.full_name)

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    profile = data as Profile | null
    const notificationData = await getNotificationsData()
    notifications = notificationData.notifications
    unreadCount = notificationData.unreadCount
  } catch {
    // Non-fatal: profile/notification fetch failures render the shell without them.
    // Auth is already validated above — this catch cannot bypass authentication.
  }

  return (
    <div className="flex h-full bg-[#050505]">
      <div className="hidden md:flex md:shrink-0">
        <Sidebar profile={profile} />
      </div>

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header profile={profile} notifications={notifications} unreadCount={unreadCount} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
