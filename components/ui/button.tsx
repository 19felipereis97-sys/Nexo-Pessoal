'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children?: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#f5f5f5] text-[#050505] hover:bg-white active:bg-[#e5e5e5]',
  secondary:
    'bg-[#171717] text-[#f5f5f5] border border-[#262626] hover:bg-[#1f1f1f] hover:border-[#333] active:bg-[#171717]',
  ghost:
    'bg-transparent text-[#a3a3a3] hover:bg-[#111111] hover:text-[#f5f5f5] active:bg-[#0a0a0a]',
  danger:
    'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20 hover:bg-[#ef4444]/20 active:bg-[#ef4444]/10',
  accent:
    'bg-[#c9a227] text-[#050505] hover:bg-[#d6b43a] active:bg-[#b8911f] font-semibold',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-7 px-3 text-xs rounded-md gap-1.5',
  md: 'h-9 px-4 text-sm rounded-lg gap-2',
  lg: 'h-11 px-6 text-base rounded-lg gap-2',
  icon: 'h-9 w-9 rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a227] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading && (
          <span className="inline-block h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
