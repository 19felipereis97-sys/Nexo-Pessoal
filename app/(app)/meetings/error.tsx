'use client'
import { ErrorState } from '@/components/ui/error-state'
export default function MeetingsError({ reset }: { reset: () => void }) { return <ErrorState title="Não foi possível abrir reuniões" onRetry={reset} className="min-h-[50vh]" /> }
