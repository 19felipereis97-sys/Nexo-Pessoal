'use client'

import Link from 'next/link'
import { MapPin, Clock, Calendar, FileText, TrendingUp, Video, ArrowUpRight } from 'lucide-react'
import { Drawer } from '@/components/ui/drawer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/utils/date'
import type { Project, Note, Meeting } from '@/lib/supabase/types'

export type DrawerItem =
  | { kind: 'project'; data: Project }
  | { kind: 'note'; data: Note }
  | { kind: 'meeting'; data: Meeting }

interface DashboardDrawerProps {
  item: DrawerItem | null
  onClose: () => void
}

function Row({ icon: Icon, label, children }: { icon?: typeof Clock; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-[#1a1a1a] py-2.5">
      <span className="flex items-center gap-1.5 text-xs text-[#737373]">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      <span className="text-right text-xs font-medium text-[#f5f5f5]">{children}</span>
    </div>
  )
}

const meetingStatusVariant: Record<string, 'accent' | 'success' | 'muted' | 'danger'> = {
  agendada: 'accent',
  realizada: 'success',
  cancelada: 'danger',
  adiada: 'muted',
  reagendada: 'muted',
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DashboardDrawer({ item, onClose }: DashboardDrawerProps) {
  if (!item) return null

  if (item.kind === 'project') {
    const p = item.data
    return (
      <Drawer open onClose={onClose} title="Detalhes do projeto" width="w-[400px]">
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-2.5">
            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a227]" />
            <h3 className="text-base font-semibold leading-snug text-[#f5f5f5]">{p.name}</h3>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-[#737373]">Progresso</span>
              <span className="text-xs font-medium text-[#c9a227]">{p.progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1a1a1a]">
              <div className="h-full rounded-full bg-[#c9a227] transition-all" style={{ width: `${p.progress}%` }} />
            </div>
          </div>

          <div className="flex flex-col">
            <Row label="Status">
              <Badge variant="success">{p.status}</Badge>
            </Row>
            <Row label="Prioridade">
              <Badge variant={p.priority === 'critica' || p.priority === 'urgente' || p.priority === 'alta' ? 'danger' : 'muted'}>{p.priority}</Badge>
            </Row>
            {p.due_date && (
              <Row icon={Calendar} label="Prazo">
                {new Date(p.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
              </Row>
            )}
          </div>

          {p.description && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-[#737373]">Descrição</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#a3a3a3]">{p.description}</p>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-[#262626] pt-2">
            <Link href="/projects">
              <Button variant="accent" className="w-full">
                Abrir em Projetos
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" className="w-full text-[#737373]" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </Drawer>
    )
  }

  if (item.kind === 'meeting') {
    const m = item.data
    return (
      <Drawer open onClose={onClose} title="Detalhes da reunião" width="w-[400px]">
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-2.5">
            <Video className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a227]" />
            <h3 className="text-base font-semibold leading-snug text-[#f5f5f5]">{m.title}</h3>
          </div>

          <div className="flex flex-col">
            <Row label="Status">
              <Badge variant={meetingStatusVariant[m.status] ?? 'muted'}>{m.status}</Badge>
            </Row>
            <Row icon={Calendar} label="Quando">{fmtDateTime(m.scheduled_at)}</Row>
            <Row icon={Clock} label="Duração">{m.duration_minutes} min</Row>
            {m.location && <Row icon={MapPin} label="Local">{m.location}</Row>}
          </div>

          {m.agenda && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-[#737373]">Pauta</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#a3a3a3]">{m.agenda}</p>
            </div>
          )}

          {m.status === 'realizada' && !m.minutes && (
            <div className="rounded-lg border border-[#eab308]/20 bg-[#eab308]/5 px-3 py-2 text-xs text-[#eab308]">
              Esta reunião foi realizada mas ainda não tem ata registrada.
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-[#262626] pt-2">
            <Link href="/meetings">
              <Button variant="accent" className="w-full">
                Abrir em Reuniões
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" className="w-full text-[#737373]" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </Drawer>
    )
  }

  // note
  const n = item.data
  return (
    <Drawer open onClose={onClose} title="Detalhes da nota" width="w-[400px]">
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-2.5">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a227]" />
          <h3 className="text-base font-semibold leading-snug text-[#f5f5f5]">{n.title}</h3>
        </div>

        <div className="flex flex-col">
          <Row label="Tipo">
            <Badge variant="muted">{n.type}</Badge>
          </Row>
          <Row icon={Clock} label="Atualizada">
            {new Date(n.updated_at).toLocaleDateString('pt-BR')} às {formatTime(n.updated_at)}
          </Row>
        </div>

        {n.content ? (
          <div>
            <p className="mb-1.5 text-xs font-medium text-[#737373]">Conteúdo</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#a3a3a3]">{n.content}</p>
          </div>
        ) : (
          <p className="text-xs italic text-[#737373]">Nota sem conteúdo.</p>
        )}

        <div className="flex flex-col gap-2 border-t border-[#262626] pt-2">
          <Link href="/notes">
            <Button variant="accent" className="w-full">
              Abrir em Anotações
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" className="w-full text-[#737373]" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Drawer>
  )
}
