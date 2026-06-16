import { AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Algo deu errado',
  message = 'Ocorreu um erro inesperado. Tente novamente.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/5">
        <AlertTriangle className="h-5 w-5 text-[#ef4444]" />
      </div>
      <div>
        <p className="text-sm font-medium text-[#f5f5f5]">{title}</p>
        <p className="mt-1 text-xs text-[#737373]">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" />
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
