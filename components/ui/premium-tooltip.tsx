'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'

interface PremiumTooltipProps {
  /** Short title shown in bold */
  title?: string
  /** Main content — string or rich node */
  content: React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  /** Delay in ms before showing (default 350) */
  delay?: number
}

const positionClasses: Record<NonNullable<PremiumTooltipProps['side']>, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

export function PremiumTooltip({
  title,
  content,
  children,
  side = 'top',
  className,
  delay = 350,
}: PremiumTooltipProps) {
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay)
  }
  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setVisible(false)
  }

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-50 max-w-[240px] rounded-xl border border-[#333] bg-[#1a1a1a]/95 px-3 py-2 text-xs leading-relaxed text-[#d4d4d4] shadow-2xl backdrop-blur-sm',
            'animate-in fade-in-0 zoom-in-95 duration-150',
            positionClasses[side],
          )}
        >
          {title && <p className="mb-0.5 font-semibold text-[#f5f5f5]">{title}</p>}
          <div className="text-[#a3a3a3]">{content}</div>
        </div>
      )}
    </div>
  )
}
