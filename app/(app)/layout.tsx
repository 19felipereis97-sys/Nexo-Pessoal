export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ensureProfile } from '@/lib/auth/actions'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { getNotificationsData } from '@/lib/data/notifications'
import type { Notification, Profile } from '@/lib/supabase/types'

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(url && key && url.startsWith('http') && key.length > 20)
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let profile: Profile | null = null
  let notifications: Notification[] = []
  let unreadCount = 0

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        redirect('/login')
      }

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
      // Falha silenciosa em dev quando o banco ainda não está configurado
    }
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
