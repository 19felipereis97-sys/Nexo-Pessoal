'use client'

import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PremiumTooltip } from '@/components/ui/premium-tooltip'

interface DashboardMetricCardProps {
  icon: LucideIcon
  label: string
  /** Main value — number or short status text */
  value: React.ReactNode
  /** Secondary description below the value */
  subtext: string
  /** Optional progress 0-100; renders a thin bar */
  progress?: number | null
  /** Tooltip explaining the indicator */
  tooltip: string
  /** True when there is no real data — softens the visuals */
  empty?: boolean
  onClick?: () => void
}

export function DashboardMetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  progress,
  tooltip,
  empty = false,
  onClick,
}: DashboardMetricCardProps) {
  const hasProgress = typeof progress === 'number'
  const clamped = hasProgress ? Math.max(0, Math.min(100, progress as number)) : 0

  return (
    <PremiumTooltip title={label} content={tooltip} side="top" className="w-full">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'nexo-surface nexo-metric-card nexo-hover group flex min-h-[132px] w-full flex-col gap-3 rounded-xl p-3.5 text-left',
          onClick ? 'cursor-pointer' : 'cursor-default',
        )}
      >
        <div className="flex items-center justify-between">
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg border transition-colors',
              empty
                ? 'border-[#262626] bg-[#0d0d0d] text-[#525252]'
                : 'border-[#c9a227]/20 bg-[#c9a227]/10 text-[#c9a227]',
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#737373]">{label}</span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className={cn('text-2xl font-bold leading-none', empty ? 'text-[#525252]' : 'text-[#f5f5f5]')}>
            {value}
          </span>
          <span className="text-xs text-[#737373]">{subtext}</span>
        </div>

        {hasProgress && (
          <div className="h-1 w-full overflow-hidden rounded-full bg-[#1a1a1a]">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                empty ? 'bg-[#262626]' : 'bg-[#c9a227]',
              )}
              style={{ width: `${clamped}%` }}
            />
          </div>
        )}
      </button>
    </PremiumTooltip>
  )
}
