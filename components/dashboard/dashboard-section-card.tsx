'use client'

import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface DashboardSectionCardProps {
  icon: LucideIcon
  title: string
  /** Optional count shown as a badge next to the title */
  count?: number
  countVariant?: 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'muted'
  /** Tint the header icon (e.g. danger for critical pending) */
  iconClassName?: string
  /** Featured cards get a faint gold hairline border */
  accent?: boolean
  /** Right-aligned header action (e.g. "Ver todos") */
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function DashboardSectionCard({
  icon: Icon,
  title,
  count,
  countVariant = 'muted',
  iconClassName,
  accent = false,
  action,
  children,
  className,
}: DashboardSectionCardProps) {
  return (
    <section
      className={cn(
        'nexo-section-card flex min-h-[230px] flex-col overflow-hidden rounded-xl',
        accent ? 'nexo-surface-accent' : 'nexo-surface',
        className,
      )}
    >
      <header className="flex items-center justify-between border-b border-[#24211a] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Icon className={cn('h-4 w-4 text-[#c9a227]', iconClassName)} />
          <h2 className="text-sm font-semibold text-[#f5f5f5]">{title}</h2>
          {typeof count === 'number' && <Badge variant={countVariant}>{count}</Badge>}
        </div>
        {action && <div className="flex items-center">{action}</div>}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  )
}
