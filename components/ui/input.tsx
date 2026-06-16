import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-[#a3a3a3]">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]">{leftIcon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'h-9 w-full rounded-lg border border-[#262626] bg-[#111111] px-3 text-sm text-[#f5f5f5]',
              'placeholder:text-[#737373]',
              'transition-all duration-150',
              'hover:border-[#333]',
              'focus:outline-none focus:border-[#c9a227]/50 focus:ring-1 focus:ring-[#c9a227]/30',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              error && 'border-[#ef4444]/50 focus:border-[#ef4444]/70 focus:ring-[#ef4444]/20',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373]">{rightIcon}</span>
          )}
        </div>
        {error && <p className="text-xs text-[#ef4444]">{error}</p>}
        {hint && !error && <p className="text-xs text-[#737373]">{hint}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
