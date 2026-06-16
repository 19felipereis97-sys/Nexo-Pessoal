import { cn } from '@/lib/utils'

interface LoadingStateProps {
  message?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingState({ message = 'Carregando...', size = 'md', className }: LoadingStateProps) {
  const spinnerSizes = { sm: 'h-4 w-4 border-2', md: 'h-6 w-6 border-2', lg: 'h-8 w-8 border-2' }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12', className)}>
      <div
        className={cn(
          'rounded-full border-[#262626] border-t-[#c9a227] animate-spin',
          spinnerSizes[size],
        )}
      />
      <p className="text-xs text-[#737373]">{message}</p>
    </div>
  )
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-4 w-4 rounded-full border-2 border-[#262626] border-t-[#c9a227] animate-spin',
        className,
      )}
    />
  )
}

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg bg-[#171717] animate-pulse',
        className,
      )}
    />
  )
}
