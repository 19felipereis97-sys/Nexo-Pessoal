'use client'

import { ErrorState } from '@/components/ui/error-state'

export default function ProjectsError({ reset }: { reset: () => void }) {
  return <ErrorState title="Não foi possível abrir projetos" onRetry={reset} className="min-h-[50vh]" />
}
