import { cn } from '@/lib/utils'
import { Button } from './button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}>
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#262626] bg-[#111111] text-[#737373]">
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-[#a3a3a3]">{title}</p>
        {description && <p className="mt-1 text-xs text-[#737373]">{description}</p>}
      </div>
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
