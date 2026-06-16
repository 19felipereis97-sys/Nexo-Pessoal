'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Sun,
  CheckSquare,
  Calendar,
  Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const primaryItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/today', label: 'Hoje', icon: Sun },
  { href: '/tasks', label: 'Tarefas', icon: CheckSquare },
  { href: '/calendar', label: 'Agenda', icon: Calendar },
  { href: '/assistant', label: 'Assistente', icon: Bot },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
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
      </div>
    </nav>
  )
}
