'use client'

import { ErrorState } from '@/components/ui/error-state'

export default function AssistantError({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      title="Nao foi possivel abrir o assistente"
      message="Tente recarregar a analise local."
      onRetry={reset}
    />
  )
}
