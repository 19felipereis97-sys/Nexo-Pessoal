'use client'

import { useEffect, useState, useTransition } from 'react'
import { Search, ChevronDown, User, LogOut, Settings, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { QuickCreateMenu } from '@/components/dashboard/quick-create-menu'
import { Modal } from '@/components/ui/modal'
import { signOut } from '@/lib/auth/actions'
import { NotificationsMenu } from './notifications-menu'
import type { Notification, Profile } from '@/lib/supabase/types'

interface HeaderProps {
  profile: Profile | null
  notifications?: Notification[]
  unreadCount?: number
}

export function Header({ profile, notifications = [], unreadCount = 0 }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const displayName = profile?.full_name?.split(' ')[0] ?? 'Usuário'
  const displayEmail = profile?.email ?? ''
  const fullName = profile?.full_name ?? 'Usuário'

  const handleLogout = () => {
    startTransition(async () => { await signOut() })
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <header className="flex h-14 items-center justify-between gap-3 border-b border-[#262626] bg-[#0a0a0a]/80 px-4 shadow-[0_1px_0_0_rgba(255,255,255,0.02)] backdrop-blur-sm">
        <button onClick={() => setSearchOpen(true)} className="group flex max-w-sm flex-1 items-center gap-2 rounded-lg border border-[#262626] bg-[#111111] px-3 py-2 text-sm text-[#737373] transition-all hover:border-[#c9a227]/30 hover:text-[#a3a3a3]">
          <Search className="h-3.5 w-3.5 shrink-0 transition-colors group-hover:text-[#c9a227]" />
          <span>Buscar tarefas, projetos, notas...</span>
          <kbd className="ml-auto hidden items-center gap-1 rounded border border-[#262626] px-1 font-mono text-[10px] text-[#737373] sm:inline-flex">Ctrl K</kbd>
        </button>

        <div className="flex items-center gap-2">
          <QuickCreateMenu />
          <NotificationsMenu initialNotifications={notifications} initialUnreadCount={unreadCount} />
          <div className="relative">
            <button onClick={() => setUserMenuOpen((open) => !open)} className="flex items-center gap-2 rounded-lg border border-[#262626] bg-[#111111] px-2.5 py-1.5 transition-all hover:border-[#333]">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#c9a227]/20 text-[#c9a227]">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt={fullName} className="h-6 w-6 rounded-full object-cover" />
                ) : <User className="h-3.5 w-3.5" />}
              </div>
              <span className="hidden text-sm font-medium text-[#f5f5f5] sm:block">{displayName}</span>
              <ChevronDown className={cn('h-3.5 w-3.5 text-[#737373] transition-transform', userMenuOpen && 'rotate-180')} />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} aria-hidden="true" />
                <div className="absolute right-0 top-11 z-40 w-52 rounded-xl border border-[#262626] bg-[#111111] p-1.5 shadow-2xl">
                  <div className="mb-1 px-3 py-2">
                    <p className="truncate text-xs font-medium text-[#f5f5f5]">{fullName}</p>
                    <p className="truncate text-[10px] text-[#737373]">{displayEmail}</p>
                  </div>
                  <div className="border-t border-[#262626] pt-1">
                    <Link href="/settings" onClick={() => setUserMenuOpen(false)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#a3a3a3] transition-all hover:bg-[#171717] hover:text-[#f5f5f5]">
                      <Settings className="h-4 w-4" /> Configurações
                    </Link>
                    <button onClick={handleLogout} disabled={isPending} className="mt-0.5 flex w-full items-center gap-2.5 rounded-lg border-t border-[#262626] px-3 py-2 pt-2 text-sm text-[#ef4444] transition-all hover:bg-[#ef4444]/5 disabled:opacity-50">
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                      {isPending ? 'Saindo...' : 'Sair'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <Modal open={searchOpen} onClose={() => setSearchOpen(false)} size="lg">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-[#c9a227]/30 bg-[#0a0a0a] px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-[#c9a227]" />
            <input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Buscar tarefas, projetos, notas..." className="flex-1 bg-transparent text-sm text-[#f5f5f5] placeholder:text-[#737373] focus:outline-none" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="text-[#737373] hover:text-[#a3a3a3]"><span className="text-xs">Limpar</span></button>}
          </div>
          <div className="py-6 text-center">
            <p className="text-sm text-[#737373]">{searchQuery ? `Nenhum resultado para "${searchQuery}"` : 'Digite para buscar em todo o sistema'}</p>
            {!searchQuery && <p className="mt-1 text-xs text-[#737373]">Tarefas, projetos, reuniões, notas e documentos</p>}
          </div>
        </div>
      </Modal>
    </>
  )
}
