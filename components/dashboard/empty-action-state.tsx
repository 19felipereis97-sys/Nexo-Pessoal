'use client'

import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface EmptyActionStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  /** Positive variant uses green tones (e.g. "tudo em dia") */
  variant?: 'default' | 'positive'
  className?: string
  compact?: boolean
}

export function EmptyActionState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'default',
  className,
  compact = false,
}: EmptyActionStateProps) {
  const positive = variant === 'positive'
  const ActionIcon = action?.icon

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-center',
        compact ? 'px-5 py-6' : 'px-5 py-9',
        className,
      )}
    >
      <span
        className={cn(
          'flex items-center justify-center rounded-xl border',
          compact ? 'h-10 w-10' : 'h-12 w-12',
          positive
            ? 'border-[#22c55e]/20 bg-[#22c55e]/5 text-[#22c55e]'
            : 'border-[#262626] bg-[#0d0d0d] text-[#525252]',
        )}
      >
        <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
      </span>
      <div>
        <p className={cn('text-sm font-medium', positive ? 'text-[#86efac]' : 'text-[#a3a3a3]')}>{title}</p>
        {description && <p className="mt-1 text-xs text-[#737373]">{description}</p>}
      </div>
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick} className="mt-0.5">
          {ActionIcon && <ActionIcon className="h-3.5 w-3.5" />}
          {action.label}
        </Button>
      )}
    </div>
  )
}
