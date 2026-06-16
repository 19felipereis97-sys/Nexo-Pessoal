'use client'
import { ErrorState } from '@/components/ui/error-state'
export default function TodayError({ reset }: { reset: () => void }) { return <ErrorState title="Não foi possível abrir o dia" onRetry={reset} className="min-h-[60vh]" /> }
