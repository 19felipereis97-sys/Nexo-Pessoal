'use client'
import { ErrorState } from '@/components/ui/error-state'
export default function ReportsError({ reset }: { reset: () => void }) { return <ErrorState title="Não foi possível gerar o relatório" onRetry={reset} className="min-h-[60vh]" /> }
