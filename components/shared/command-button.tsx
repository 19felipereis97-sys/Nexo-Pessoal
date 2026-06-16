'use client'

import { cn } from '@/lib/utils'

interface CommandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode
  label: string
  shortcut?: string
  description?: string
}

export function CommandButton({ icon, label, shortcut, description, className, ...props }: CommandButtonProps) {
  return (
    <button
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150',
        'hover:bg-[#171717] active:bg-[#111111]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a227]/50',
        className,
      )}
      {...props}
    >
      {icon && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#262626] bg-[#0a0a0a] text-[#a3a3a3]">
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#f5f5f5]">{label}</p>
        {description && <p className="text-xs text-[#737373] truncate">{description}</p>}
      </div>
      {shortcut && (
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-[#262626] bg-[#0a0a0a] px-1.5 py-0.5 text-[10px] font-mono text-[#737373]">
          {shortcut}
        </kbd>
      )}
    </button>
  )
}
