'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Bell, CalendarClock, CheckCheck, CheckCircle2, Circle, FolderOpen, Trash2, Video } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PremiumTooltip } from '@/components/ui/premium-tooltip'
import { deleteNotification, markAllNotificationsRead, markNotificationRead } from '@/lib/actions/notifications'
import type { Notification } from '@/lib/supabase/types'

function routeFor(notification: Notification) {
  if (notification.entity_type === 'task') return `/tasks?highlight=${notification.entity_id}`
  if (notification.entity_type === 'event') return `/calendar?highlight=${notification.entity_id}`
  if (notification.entity_type === 'project') return `/projects/${notification.entity_id}`
  if (notification.entity_type === 'meeting') return `/meetings?highlight=${notification.entity_id}`
  return '/dashboard'
}

const severityVariant: Record<string, 'accent' | 'warning' | 'danger' | 'success' | 'muted'> = {
  info: 'accent',
  warning: 'warning',
  danger: 'danger',
  success: 'success',
}

function EntityIcon({ entityType }: { entityType: string }) {
  if (entityType === 'event') return <CalendarClock className="h-4 w-4" />
  if (entityType === 'project') return <FolderOpen className="h-4 w-4" />
  if (entityType === 'meeting') return <Video className="h-4 w-4" />
  if (entityType === 'task') return <CheckCircle2 className="h-4 w-4" />
  return <AlertTriangle className="h-4 w-4" />
}

export function NotificationsMenu({ initialNotifications, initialUnreadCount }: {
  initialNotifications: Notification[]
  initialUnreadCount: number
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [pending, startTransition] = useTransition()

  function markRead(notification: Notification) {
    if (!notification.read_at) {
      const now = new Date().toISOString()
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read_at: now } : item))
      setUnreadCount((count) => Math.max(0, count - 1))
      markNotificationRead(notification.id)
    }
  }

  function openOrigin(notification: Notification) {
    markRead(notification)
    setOpen(false)
    router.push(routeFor(notification))
  }

  function readAll() {
    startTransition(async () => {
      await markAllNotificationsRead()
      const now = new Date().toISOString()
      setNotifications((items) => items.map((item) => ({ ...item, read_at: item.read_at ?? now })))
      setUnreadCount(0)
    })
  }

  function remove(notification: Notification) {
    setNotifications((items) => items.filter((item) => item.id !== notification.id))
    if (!notification.read_at) setUnreadCount((count) => Math.max(0, count - 1))
    deleteNotification(notification.id)
  }

  return (
    <div className="relative">
      <PremiumTooltip content={`${unreadCount} notificação(ões) não lida(s)`} side="bottom">
        <button onClick={() => setOpen((value) => !value)} className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#262626] text-[#737373] transition-all hover:border-[#333] hover:text-[#f5f5f5]" aria-label="Notificações">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c9a227] px-1 text-[10px] font-bold text-[#050505]">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </button>
      </PremiumTooltip>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-11 z-40 flex max-h-[75vh] w-[min(92vw,420px)] flex-col rounded-xl border border-[#262626] bg-[#111111] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262626] p-3">
              <div>
                <p className="text-sm font-semibold text-[#f5f5f5]">Notificações</p>
                <p className="text-xs text-[#737373]">{unreadCount} não lida(s)</p>
              </div>
              <Button size="sm" variant="ghost" onClick={readAll} loading={pending} disabled={notifications.length === 0 || unreadCount === 0}>
                <CheckCheck className="h-3.5 w-3.5" /> Marcar todas
              </Button>
            </div>
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#737373]">Nenhum alerta no momento.</div>
            ) : (
              <div className="overflow-y-auto p-2">
                {notifications.map((notification) => (
                  <PremiumTooltip key={notification.id} title={notification.title} content={notification.message} side="left" className="block">
                    <div className={`group flex gap-3 rounded-lg p-2 transition-colors hover:bg-[#171717] ${!notification.read_at ? 'bg-[#c9a227]/5' : ''}`}>
                      <button onClick={() => openOrigin(notification)} className="flex min-w-0 flex-1 gap-3 text-left">
                        <span className={`mt-1 ${notification.severity === 'danger' ? 'text-[#ef4444]' : notification.severity === 'warning' ? 'text-[#eab308]' : 'text-[#c9a227]'}`}>
                          <EntityIcon entityType={notification.entity_type} />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-[#f5f5f5]">{notification.title}</span>
                            {!notification.read_at && <Circle className="h-2 w-2 fill-[#c9a227] text-[#c9a227]" />}
                          </span>
                          <span className="mt-0.5 line-clamp-2 text-xs text-[#737373]">{notification.message}</span>
                          <span className="mt-2 flex items-center gap-2">
                            <Badge variant={severityVariant[notification.severity] ?? 'muted'}>{notification.severity}</Badge>
                            <span className="text-[10px] text-[#525252]">{new Date(notification.created_at).toLocaleDateString('pt-BR')}</span>
                          </span>
                        </span>
                      </button>
                      <div className="flex shrink-0 flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                        {!notification.read_at && <Button aria-label="Marcar notificação como lida" size="icon" variant="ghost" className="h-7 w-7" onClick={() => markRead(notification)}><CheckCircle2 className="h-3.5 w-3.5" /></Button>}
                        <Button aria-label="Excluir notificação" size="icon" variant="ghost" className="h-7 w-7 text-[#ef4444]" onClick={() => remove(notification)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </PremiumTooltip>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
