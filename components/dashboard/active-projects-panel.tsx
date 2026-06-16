'use client'

import Link from 'next/link'
import { TrendingUp, FolderPlus } from 'lucide-react'
import { DashboardSectionCard } from './dashboard-section-card'
import { EmptyActionState } from './empty-action-state'
import { PremiumTooltip } from '@/components/ui/premium-tooltip'
import { Badge } from '@/components/ui/badge'
import { PRIORITY_BADGE } from './constants'
import type { Project } from '@/lib/supabase/types'

interface ActiveProjectsPanelProps {
  projects: Project[]
  onSelect: (p: Project) => void
  onCreate: () => void
  /** Compact mode for the lower summary row */
  compact?: boolean
}

function nextStep(p: Project): string {
  if (p.progress >= 100) return 'Concluir e arquivar'
  if (p.progress >= 75) return 'Reta final'
  if (p.progress >= 25) return 'Em execução'
  if (p.progress > 0) return 'Início dos trabalhos'
  return 'Planejar primeiras tarefas'
}

export function ActiveProjectsPanel({ projects, onSelect, onCreate, compact = false }: ActiveProjectsPanelProps) {
  return (
    <DashboardSectionCard
      icon={TrendingUp}
      title={compact ? 'Projetos' : 'Projetos em andamento'}
      count={projects.length}
      action={
        projects.length > 0 ? (
          <Link href="/projects" className="text-xs font-medium text-[#c9a227] transition-colors hover:text-[#d6b43a]">
            Ver todos
          </Link>
        ) : undefined
      }
    >
      {projects.length === 0 ? (
        <EmptyActionState
          icon={TrendingUp}
          title="Nenhum projeto ativo"
          description="Estruture seu trabalho criando o primeiro projeto."
          action={{ label: 'Criar primeiro projeto', onClick: onCreate, icon: FolderPlus }}
          compact={compact}
        />
      ) : (
        <ul className="flex flex-col divide-y divide-[#0d0d0d]">
          {projects.map((p) => (
            <li
              key={p.id}
              onClick={() => onSelect(p)}
              className="group flex cursor-pointer flex-col gap-2 px-5 py-3 transition-colors hover:bg-[#0d0d0d]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-[#f5f5f5]">{p.name}</p>
                <div className="flex shrink-0 items-center gap-2">
                  {!compact && (
                    <Badge variant={PRIORITY_BADGE[p.priority] ?? 'muted'} className="text-[10px]">
                      {p.priority}
                    </Badge>
                  )}
                  <span className="text-xs font-medium text-[#c9a227]">{p.progress}%</span>
                </div>
              </div>

              <PremiumTooltip content={`${p.progress}% concluído · ${nextStep(p)}`} side="top" className="w-full">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1a1a1a]">
                  <div
                    className="h-full rounded-full bg-[#c9a227] transition-all duration-500"
                    style={{ width: `${Math.min(100, p.progress)}%` }}
                  />
                </div>
              </PremiumTooltip>

              {!compact && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#737373]">{nextStep(p)}</span>
                  {p.due_date && (
                    <span className="text-xs text-[#525252]">
                      Prazo {new Date(p.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </DashboardSectionCard>
  )
}
