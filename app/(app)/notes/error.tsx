'use client'
import { ErrorState } from '@/components/ui/error-state'
export default function NotesError({ reset }: { reset: () => void }) { return <ErrorState title="Não foi possível abrir anotações" onRetry={reset} className="min-h-[50vh]" /> }
