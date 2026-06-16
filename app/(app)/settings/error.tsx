'use client'
import { ErrorState } from '@/components/ui/error-state'
export default function SettingsError({ reset }: { reset: () => void }) { return <ErrorState title="Não foi possível carregar as configurações" onRetry={reset} className="min-h-[60vh]" /> }
