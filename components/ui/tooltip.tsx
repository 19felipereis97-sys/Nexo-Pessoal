'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  content: string
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchedRef = useRef(false)

  const show = () => {
    if (touchedRef.current) return
    timeoutRef.current = setTimeout(() => setVisible(true), 400)
  }

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setVisible(false)
  }

  const showBriefly = () => {
    touchedRef.current = true
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setVisible(true)
    timeoutRef.current = setTimeout(() => {
      setVisible(false)
      touchedRef.current = false
    }, 1500)
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onTouchEnd={showBriefly}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-50 whitespace-nowrap rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-1.5 text-xs text-[#f5f5f5] shadow-xl',
            'animate-in fade-in-0 zoom-in-95 duration-150',
            positionClasses[side],
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}
