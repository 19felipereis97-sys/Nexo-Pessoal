'use client'
import { ErrorState } from '@/components/ui/error-state'
export default function RoutinesError({ reset }: { reset: () => void }) { return <ErrorState title="Não foi possível carregar as rotinas" onRetry={reset} className="min-h-[60vh]" /> }
