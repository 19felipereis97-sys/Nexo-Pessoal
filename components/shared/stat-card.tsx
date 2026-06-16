import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  tooltip?: string
  trend?: {
    value: number
    label: string
  }
  icon?: React.ReactNode
  accent?: boolean
  className?: string
}

export function StatCard({ title, value, description, tooltip, trend, icon, accent, className }: StatCardProps) {
  const trendPositive = trend && trend.value > 0
  const trendNeutral = trend && trend.value === 0

  return (
    <Card className={cn('hover:border-[#333] transition-all duration-200', accent && 'border-[#c9a227]/20', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Tooltip content={tooltip || title} side="top">
              <p className="text-xs font-medium text-[#737373] truncate cursor-default">{title}</p>
            </Tooltip>
            <p className={cn('mt-1.5 text-2xl font-bold tracking-tight', accent ? 'text-[#c9a227]' : 'text-[#f5f5f5]')}>
              {value}
            </p>
            {description && <p className="mt-1 text-xs text-[#737373]">{description}</p>}
          </div>
          {icon && (
            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#262626]', accent ? 'text-[#c9a227] bg-[#c9a227]/5' : 'text-[#737373] bg-[#0a0a0a]')}>
              {icon}
            </div>
          )}
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1.5">
            {trendNeutral ? (
              <Minus className="h-3 w-3 text-[#737373]" />
            ) : trendPositive ? (
              <TrendingUp className="h-3 w-3 text-[#22c55e]" />
            ) : (
              <TrendingDown className="h-3 w-3 text-[#ef4444]" />
            )}
            <span className={cn('text-xs font-medium', trendNeutral ? 'text-[#737373]' : trendPositive ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-[#737373]">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
