'use client'
import { ErrorState } from '@/components/ui/error-state'
export default function DocumentsError({ reset }: { reset: () => void }) { return <ErrorState title="Não foi possível carregar os documentos" onRetry={reset} className="min-h-[60vh]" /> }
