'use client'
import { ErrorState } from '@/components/ui/error-state'
export default function DashboardError({ reset }: { reset: () => void }) { return <ErrorState title="Não foi possível carregar o dashboard" onRetry={reset} className="min-h-[60vh]" /> }
