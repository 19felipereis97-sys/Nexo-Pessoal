'use client'

import { AlertTriangle, CheckCircle2, FileWarning, Clock3, ChevronRight } from 'lucide-react'
import { DashboardSectionCard } from './dashboard-section-card'
import { EmptyActionState } from './empty-action-state'
import { PremiumTooltip } from '@/components/ui/premium-tooltip'
import { Badge } from '@/components/ui/badge'
import { PRIORITY_BADGE } from './constants'
import { daysOverdue } from '@/lib/utils/date'
import type { Task, Meeting, Project } from '@/lib/supabase/types'

interface CriticalPendingPanelProps {
  overdueTasks: Task[]
  meetingsWithoutMinutes: Meeting[]
  staleProjects: Project[]
  onSelectTask: (t: Task) => void
  onSelectMeeting: (m: Meeting) => void
  onSelectProject: (p: Project) => void
}

export function CriticalPendingPanel({
  overdueTasks,
  meetingsWithoutMinutes,
  staleProjects,
  onSelectTask,
  onSelectMeeting,
  onSelectProject,
}: CriticalPendingPanelProps) {
  const total = overdueTasks.length + meetingsWithoutMinutes.length + staleProjects.length

  return (
    <DashboardSectionCard
      icon={AlertTriangle}
      title="Pendências críticas"
      iconClassName={total > 0 ? 'text-[#ef4444]' : 'text-[#22c55e]'}
      count={total > 0 ? total : undefined}
      countVariant="danger"
      accent={total > 0}
    >
      {total === 0 ? (
        <EmptyActionState
          icon={CheckCircle2}
          title="Tudo em dia"
          description="Nenhuma tarefa atrasada, reunião sem ata ou projeto parado."
          variant="positive"
        />
      ) : (
        <ul className="flex flex-col divide-y divide-[#0d0d0d]">
          {overdueTasks.map((task) => {
            const days = task.due_date ? daysOverdue(task.due_date) : 0
            return (
              <li
                key={`task-${task.id}`}
                onClick={() => onSelectTask(task)}
                className="group flex cursor-pointer items-start gap-3 px-5 py-3 transition-colors hover:bg-[#0d0d0d]"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#ef4444]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-[#f5f5f5]">{task.title}</p>
                  <p className="mt-0.5 text-xs text-[#ef4444]">
                    Tarefa · {days} dia{days > 1 ? 's' : ''} em atraso
                  </p>
                </div>
                <Badge variant={PRIORITY_BADGE[task.priority] ?? 'muted'} className="shrink-0 text-[10px]">
                  {task.priority}
                </Badge>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#333] opacity-0 transition-opacity group-hover:opacity-100" />
              </li>
            )
          })}

          {meetingsWithoutMinutes.map((m) => (
            <li
              key={`meeting-${m.id}`}
              onClick={() => onSelectMeeting(m)}
              className="group flex cursor-pointer items-start gap-3 px-5 py-3 transition-colors hover:bg-[#0d0d0d]"
            >
              <FileWarning className="mt-0.5 h-4 w-4 shrink-0 text-[#eab308]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[#f5f5f5]">{m.title}</p>
                <p className="mt-0.5 text-xs text-[#eab308]">Reunião realizada sem ata</p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#333] opacity-0 transition-opacity group-hover:opacity-100" />
            </li>
          ))}

          {staleProjects.map((p) => (
            <li
              key={`project-${p.id}`}
              onClick={() => onSelectProject(p)}
              className="group flex cursor-pointer items-start gap-3 px-5 py-3 transition-colors hover:bg-[#0d0d0d]"
            >
              <PremiumTooltip content="Sem atualização há mais de 14 dias" side="right">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#737373]" />
              </PremiumTooltip>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[#f5f5f5]">{p.name}</p>
                <p className="mt-0.5 text-xs text-[#737373]">Projeto sem movimentação</p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#333] opacity-0 transition-opacity group-hover:opacity-100" />
            </li>
          ))}
        </ul>
      )}
    </DashboardSectionCard>
  )
}
