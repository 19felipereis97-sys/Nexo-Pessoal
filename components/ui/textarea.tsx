import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-medium text-[#a3a3a3]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'min-h-[80px] w-full rounded-lg border border-[#262626] bg-[#111111] px-3 py-2 text-sm text-[#f5f5f5]',
            'placeholder:text-[#737373]',
            'transition-all duration-150 resize-y',
            'hover:border-[#333]',
            'focus:outline-none focus:border-[#c9a227]/50 focus:ring-1 focus:ring-[#c9a227]/30',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            error && 'border-[#ef4444]/50 focus:border-[#ef4444]/70 focus:ring-[#ef4444]/20',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-[#ef4444]">{error}</p>}
        {hint && !error && <p className="text-xs text-[#737373]">{hint}</p>}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
