'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children?: React.ReactNode
  side?: 'right' | 'left'
  width?: string
}

export function Drawer({ open, onClose, title, description, children, side = 'right', width = 'w-96' }: DrawerProps) {
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
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'absolute top-0 bottom-0 flex flex-col border-[#262626] bg-[#111111] shadow-2xl',
          side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
          width,
        )}
      >
        <div className="flex items-start justify-between border-b border-[#262626] p-5">
          <div>
            {title && <h2 className="text-base font-semibold text-[#f5f5f5]">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-[#737373]">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 -mt-1 -mr-1">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}
