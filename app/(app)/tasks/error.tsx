'use client'
import { ErrorState } from '@/components/ui/error-state'
export default function TasksError({ reset }: { reset: () => void }) { return <ErrorState title="Não foi possível carregar as tarefas" onRetry={reset} className="min-h-[60vh]" /> }
