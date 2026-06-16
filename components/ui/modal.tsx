'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
}

export function Modal({ open, onClose, title, description, children, size = 'md', className }: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'relative z-10 w-full rounded-2xl border border-[#262626] bg-[#111111] shadow-2xl',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          sizeClasses[size],
          className,
        )}
      >
        <div className="flex items-start justify-between p-5 pb-0">
          <div>
            {title && (
              <h2 id="modal-title" className="text-base font-semibold text-[#f5f5f5]">
                {title}
              </h2>
            )}
            {description && <p className="mt-0.5 text-sm text-[#737373]">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 -mt-1 -mr-1">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
