'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/tooltip'
import type { Profile } from '@/lib/supabase/types'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const groups: NavGroup[] = [
  {
    label: 'Geral',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/today', label: 'Hoje', icon: Sun },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { href: '/tasks', label: 'Tarefas', icon: CheckSquare },
      { href: '/projects', label: 'Projetos', icon: FolderOpen },
      { href: '/calendar', label: 'Agenda', icon: Calendar },
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

interface SidebarProps {
  collapsed?: boolean
  profile?: Profile | null
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || !parts[0]) return 'N'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Sidebar({ collapsed = false, profile }: SidebarProps) {
  const pathname = usePathname()
  const fullName = profile?.full_name ?? 'Usuário'
  const email = profile?.email ?? 'Conta pessoal'

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-[#262626] bg-[#0a0a0a] transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo card */}
      <div className="p-3">
        <div
          className={cn(
            'flex items-center rounded-xl border border-[#1f1f1f] bg-gradient-to-b from-[#141414] to-[#0d0d0d] px-3 py-2.5',
            collapsed ? 'justify-center' : 'gap-2.5',
          )}
        >
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg ring-1 ring-[#c9a227]/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/nexo-symbol.png" alt="Nexo Pessoal" className="h-full w-full scale-110 object-cover" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-none text-[#f5f5f5]">Nexo Pessoal</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-[#737373]">Central executiva</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-3 overflow-y-auto px-2 pb-2">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-0.5">
            {!collapsed && (
              <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-[#525252]">
                {group.label}
              </p>
            )}
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </nav>

      {/* Profile footer */}
      <div className="border-t border-[#1f1f1f] p-3">
        <Link
          href="/settings"
          className={cn(
            'flex items-center rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] p-2 transition-all hover:border-[#333] hover:bg-[#111111]',
            collapsed ? 'justify-center' : 'gap-2.5',
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#c9a227]/30 bg-[#c9a227]/10 text-xs font-semibold text-[#c9a227]">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={fullName} className="h-full w-full object-cover" />
            ) : (
              initials(fullName)
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-[#f5f5f5]">{fullName}</p>
              <p className="truncate text-[10px] text-[#737373]">{email}</p>
            </div>
          )}
        </Link>
      </div>
    </aside>
  )
}

function NavLink({ item, pathname, collapsed }: { item: NavItem; pathname: string; collapsed: boolean }) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
  const Icon = item.icon

  const link = (
    <Link
      href={item.href}
      className={cn(
        'group relative flex items-center rounded-lg text-sm transition-all duration-150',
        collapsed ? 'h-9 w-9 justify-center' : 'h-9 gap-2.5 px-3',
        isActive
          ? 'border border-[#c9a227]/30 bg-[#c9a227]/10 font-medium text-[#c9a227]'
          : 'border border-transparent text-[#737373] hover:bg-[#141414] hover:text-[#e5e5e5]',
      )}
    >
      {isActive && !collapsed && (
        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[#c9a227]" />
      )}
      <Icon className={cn('h-4 w-4 shrink-0 transition-colors', !isActive && 'group-hover:text-[#c9a227]')} />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  )

  if (collapsed) {
    return <Tooltip content={item.label} side="right">{link}</Tooltip>
  }
  return link
}
