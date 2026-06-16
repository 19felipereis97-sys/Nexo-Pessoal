'use client'

import Link from 'next/link'
import { Video, CalendarPlus } from 'lucide-react'
import { DashboardSectionCard } from './dashboard-section-card'
import { EmptyActionState } from './empty-action-state'
import { Badge } from '@/components/ui/badge'
import { MEETING_STATUS_BADGE } from './constants'
import type { Meeting } from '@/lib/supabase/types'

interface MeetingsSummaryPanelProps {
  meetings: Meeting[]
  onSelect: (m: Meeting) => void
  onCreate: () => void
}

function whenLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `Hoje · ${time}`
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} · ${time}`
}

export function MeetingsSummaryPanel({ meetings, onSelect, onCreate }: MeetingsSummaryPanelProps) {
  return (
    <DashboardSectionCard
      icon={Video}
      title="Reuniões"
      count={meetings.length}
      action={
        meetings.length > 0 ? (
          <Link href="/meetings" className="text-xs font-medium text-[#c9a227] transition-colors hover:text-[#d6b43a]">
            Ver todas
          </Link>
        ) : undefined
      }
    >
      {meetings.length === 0 ? (
        <EmptyActionState
          icon={Video}
          title="Nenhuma reunião próxima"
          description="Agende uma reunião para manter o time alinhado."
          action={{ label: 'Nova reunião', onClick: onCreate, icon: CalendarPlus }}
          compact
        />
      ) : (
        <ul className="flex flex-col divide-y divide-[#0d0d0d]">
          {meetings.map((m) => (
            <li
              key={m.id}
              onClick={() => onSelect(m)}
              className="group flex cursor-pointer items-start gap-3 px-5 py-3 transition-colors hover:bg-[#0d0d0d]"
            >
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#c9a227]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[#f5f5f5]">{m.title}</p>
                <p className="mt-0.5 text-xs text-[#737373]">{whenLabel(m.scheduled_at)}</p>
              </div>
              <Badge variant={MEETING_STATUS_BADGE[m.status] ?? 'muted'} className="shrink-0 text-[10px]">
                {m.status}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </DashboardSectionCard>
  )
}
