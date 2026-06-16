'use client'
import { ErrorState } from '@/components/ui/error-state'
export default function ProjectDetailError({ reset }: { reset: () => void }) { return <ErrorState title="Não foi possível carregar o projeto" onRetry={reset} className="min-h-[60vh]" /> }
