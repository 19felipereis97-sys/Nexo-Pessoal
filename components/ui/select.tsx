'use client'

import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs font-medium text-[#a3a3a3]">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'h-9 w-full appearance-none rounded-lg border border-[#262626] bg-[#111111] pl-3 pr-9 text-sm text-[#f5f5f5]',
              'transition-all duration-150',
              'hover:border-[#333]',
              'focus:outline-none focus:border-[#c9a227]/50 focus:ring-1 focus:ring-[#c9a227]/30',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              error && 'border-[#ef4444]/50',
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#111111]">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]" />
        </div>
        {error && <p className="text-xs text-[#ef4444]">{error}</p>}
        {hint && !error && <p className="text-xs text-[#737373]">{hint}</p>}
      </div>
    )
  },
)

Select.displayName = 'Select'
