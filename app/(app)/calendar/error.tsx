'use client'
import { ErrorState } from '@/components/ui/error-state'
export default function CalendarError({ reset }: { reset: () => void }) { return <ErrorState title="Não foi possível carregar a agenda" onRetry={reset} className="min-h-[60vh]" /> }
