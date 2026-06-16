'use client'

import Link from 'next/link'
import { StickyNote, Pin, PinOff, FileText } from 'lucide-react'
import { DashboardSectionCard } from './dashboard-section-card'
import { EmptyActionState } from './empty-action-state'
import { PremiumTooltip } from '@/components/ui/premium-tooltip'
import { Badge } from '@/components/ui/badge'
import type { Note } from '@/lib/supabase/types'

interface RecentNotesPanelProps {
  notes: Note[]
  pinnedIds: Set<string>
  onTogglePin: (id: string) => void
  onSelect: (n: Note) => void
  onCreate: () => void
}

function preview(content: string): string {
  const clean = content.replace(/\s+/g, ' ').trim()
  return clean.length > 80 ? `${clean.slice(0, 80)}…` : clean
}

export function RecentNotesPanel({ notes, pinnedIds, onTogglePin, onSelect, onCreate }: RecentNotesPanelProps) {
  const ordered = [...notes].sort((a, b) => {
    const pa = pinnedIds.has(a.id) ? 0 : 1
    const pb = pinnedIds.has(b.id) ? 0 : 1
    return pa - pb
  })

  return (
    <DashboardSectionCard
      icon={StickyNote}
      title="Notas recentes"
      count={notes.length}
      action={
        notes.length > 0 ? (
          <Link href="/notes" className="text-xs font-medium text-[#c9a227] transition-colors hover:text-[#d6b43a]">
            Ver todas
          </Link>
        ) : undefined
      }
    >
      {notes.length === 0 ? (
        <EmptyActionState
          icon={StickyNote}
          title="Nenhuma nota ainda"
          description="Capture ideias e referências rapidamente."
          action={{ label: 'Nova nota', onClick: onCreate, icon: FileText }}
          compact
        />
      ) : (
        <ul className="flex flex-col divide-y divide-[#0d0d0d]">
          {ordered.map((n) => {
            const pinned = pinnedIds.has(n.id)
            return (
              <li
                key={n.id}
                className="group flex items-start gap-3 px-5 py-3 transition-colors hover:bg-[#0d0d0d]"
              >
                <button onClick={() => onSelect(n)} className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-2">
                    {pinned && <Pin className="h-3 w-3 shrink-0 fill-[#c9a227] text-[#c9a227]" />}
                    <p className="truncate text-sm font-medium text-[#f5f5f5]">{n.title}</p>
                    {n.type !== 'nota' && (
                      <Badge variant="muted" className="text-[10px]">{n.type}</Badge>
                    )}
                  </div>
                  {n.content && <p className="mt-0.5 truncate text-xs text-[#737373]">{preview(n.content)}</p>}
                </button>
                <PremiumTooltip content={pinned ? 'Desafixar nota' : 'Fixar no topo'} side="left">
                  <button
                    onClick={() => onTogglePin(n.id)}
                    className={`shrink-0 rounded-md p-1 transition-colors ${
                      pinned ? 'text-[#c9a227]' : 'text-[#525252] opacity-0 group-hover:opacity-100 hover:text-[#c9a227]'
                    }`}
                  >
                    {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                  </button>
                </PremiumTooltip>
              </li>
            )
          })}
        </ul>
      )}
    </DashboardSectionCard>
  )
}
