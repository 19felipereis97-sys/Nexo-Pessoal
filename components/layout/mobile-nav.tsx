'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Sun,
  CheckSquare,
  FolderOpen,
  Calendar,
  Video,
  StickyNote,
  FileText,
  RotateCcw,
  BarChart3,
  Bot,
  Settings,
  MoreHorizontal,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const primaryItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/today', label: 'Hoje', icon: Sun },
  { href: '/tasks', label: 'Tarefas', icon: CheckSquare },
  { href: '/calendar', label: 'Agenda', icon: Calendar },
]

const drawerGroups = [
  {
    label: 'Gestão',
    items: [
      { href: '/projects', label: 'Projetos', icon: FolderOpen },
      { href: '/meetings', label: 'Reuniões', icon: Video },
    ],
  },
  {
    label: 'Conhecimento',
    items: [
      { href: '/notes', label: 'Anotações', icon: StickyNote },
      { href: '/documents', label: 'Documentos', icon: FileText },
      { href: '/routines', label: 'Rotinas', icon: RotateCcw },
      { href: '/reports', label: 'Relatórios', icon: BarChart3 },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/assistant', label: 'Assistente', icon: Bot },
      { href: '/settings', label: 'Configurações', icon: Settings },
    ],
  },
]

export function MobileNav() {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isDrawerItemActive = drawerGroups
    .flatMap((g) => g.items)
    .some((item) => pathname === item.href || pathname.startsWith(item.href + '/'))

  return (
    <>
      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#262626] bg-[#0a0a0a] px-1 pb-safe md:hidden">
        <div className="flex items-center justify-around py-1">
          {primaryItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-xl p-2 min-w-[56px] transition-all',
                  isActive ? 'text-[#c9a227]' : 'text-[#737373] hover:text-[#a3a3a3]',
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[9px] font-medium">{item.label}</span>
              </Link>
            )
          })}

          {/* Mais button */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-xl p-2 min-w-[56px] transition-all',
              isDrawerItemActive ? 'text-[#c9a227]' : 'text-[#737373] hover:text-[#a3a3a3]',
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[9px] font-medium">Mais</span>
          </button>
        </div>
      </nav>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-[#262626] bg-[#0a0a0a] pb-safe transition-transform duration-300 ease-out md:hidden',
          drawerOpen ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-[#333]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-sm font-semibold text-[#e5e5e5]">Menu</p>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#525252] hover:bg-[#1a1a1a] hover:text-[#f5f5f5] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Groups */}
        <div className="overflow-y-auto px-4 pb-6 max-h-[60vh]">
          {drawerGroups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-[#525252]">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                        isActive
                          ? 'border border-[#c9a227]/30 bg-[#c9a227]/10 font-medium text-[#c9a227]'
                          : 'border border-transparent text-[#737373] hover:bg-[#141414] hover:text-[#e5e5e5]',
                      )}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
