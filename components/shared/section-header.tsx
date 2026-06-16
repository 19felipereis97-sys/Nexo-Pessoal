import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function SectionHeader({ title, description, actions, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4 mb-3', className)}>
      <div>
        <h2 className="text-sm font-semibold text-[#f5f5f5]">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-[#737373]">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
