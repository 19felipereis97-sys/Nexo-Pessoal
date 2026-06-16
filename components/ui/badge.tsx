import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'muted'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[#262626] text-[#a3a3a3]',
  success: 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20',
  warning: 'bg-[#eab308]/10 text-[#eab308] border border-[#eab308]/20',
  danger: 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20',
  accent: 'bg-[#c9a227]/10 text-[#c9a227] border border-[#c9a227]/20',
  muted: 'bg-[#111111] text-[#737373] border border-[#262626]',
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
