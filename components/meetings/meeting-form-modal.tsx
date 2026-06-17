'use client'

import { useState, useTransition } from 'react'
import { LayoutTemplate } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { createMeeting, updateMeeting, type MeetingInput } from '@/lib/actions/meetings'
import type { Meeting, Project } from '@/lib/supabase/types'
import { MEETING_STATUSES, MEETING_STATUS_LABEL } from './constants'

const durations = [15, 30, 45, 60, 90, 120]
const local = (iso?: string) => iso ? iso.slice(0, 16) : new Date(Date.now() + 3600000).toISOString().slice(0, 16)

const MEETING_TEMPLATES: Array<{ label: string; agenda: string; minutes: string }> = [
  {
    label: '1:1',
    agenda: `## Pauta — 1:1\n\n- Check-in: como está a semana?\n- Atualizações de progresso\n- Bloqueios e dificuldades\n- Feedback (bidirecional)\n- Próximos passos e prioridades`,
    minutes: `## Ata — 1:1\n\n**Data:** \n**Participantes:** \n\n### Pontos discutidos\n\n1. \n2. \n3. \n\n### Decisões tomadas\n\n- \n\n### Próximos passos\n\n| Ação | Responsável | Prazo |\n|------|-------------|-------|\n|      |             |       |`,
  },
  {
    label: 'Planejamento Sprint',
    agenda: `## Pauta — Planejamento Sprint\n\n1. Revisão do backlog priorizado\n2. Capacidade do time no período\n3. Seleção de itens para o sprint\n4. Divisão de tarefas\n5. Definição do objetivo do sprint`,
    minutes: `## Ata — Planejamento Sprint\n\n**Sprint:** \n**Período:** \n\n### Objetivo do sprint\n\n> \n\n### Itens selecionados\n\n| Item | Estimativa | Responsável |\n|------|------------|-------------|\n|      |            |             |\n\n### Impedimentos identificados\n\n- \n\n### Próximos passos\n\n- `,
  },
  {
    label: 'Revisão Mensal',
    agenda: `## Pauta — Revisão Mensal\n\n1. Resultados e métricas do mês\n2. O que foi bem (wins)\n3. O que pode melhorar\n4. Projetos em andamento: status\n5. Prioridades do próximo mês`,
    minutes: `## Ata — Revisão Mensal\n\n**Mês:** \n\n### Resultados\n\n- \n\n### Wins do mês\n\n- \n\n### Oportunidades de melhoria\n\n- \n\n### Status dos projetos\n\n| Projeto | Status | % | Próx. ação |\n|---------|--------|---|------------|\n|         |        |   |            |\n\n### Prioridades do próximo mês\n\n1. \n2. \n3. `,
  },
  {
    label: 'Apresentação / Demo',
    agenda: `## Pauta — Apresentação\n\n1. Contexto e objetivo\n2. Demonstração\n3. Perguntas e respostas\n4. Feedback dos participantes\n5. Próximos passos`,
    minutes: `## Ata — Apresentação\n\n**Tema:** \n\n### Resumo\n\n\n\n### Perguntas levantadas\n\n- \n\n### Feedback recebido\n\n- \n\n### Decisões e próximos passos\n\n- `,
  },
]

export function MeetingFormModal({ open, meeting, projects, onClose, onSaved }: {
  open: boolean; meeting?: Meeting | null; projects: Project[]; onClose: () => void; onSaved: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [participants, setParticipants] = useState((meeting?.participants ?? []).join(', '))
  const [showTemplates, setShowTemplates] = useState(false)
  const [form, setForm] = useState<MeetingInput>({
    title: meeting?.title ?? '', description: meeting?.description ?? '', project_id: meeting?.project_id ?? '',
    scheduled_at: local(meeting?.scheduled_at), duration_minutes: meeting?.duration_minutes ?? 30,
    location: meeting?.location ?? '', participants: meeting?.participants ?? [], agenda: meeting?.agenda ?? '',
    minutes: meeting?.minutes ?? '', next_steps: meeting?.next_steps ?? '', status: meeting?.status ?? 'agendada',
  })

  function applyTemplate(tpl: typeof MEETING_TEMPLATES[number]) {
    setForm((prev) => ({ ...prev, agenda: tpl.agenda, minutes: tpl.minutes }))
    setShowTemplates(false)
  }

  function submit(event: React.FormEvent) {
    event.preventDefault(); setError('')
    const input = { ...form, participants: participants.split(',').map((item) => item.trim()).filter(Boolean) }
    startTransition(async () => {
      const result = meeting ? await updateMeeting(meeting.id, input) : await createMeeting(input)
      if (result.error) return setError(result.error)
      onSaved(); onClose()
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={meeting ? 'Editar reunião' : 'Nova reunião'} size="lg">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Título *" value={form.title} autoFocus onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>

        <Select
          label="Projeto vinculado *"
          value={form.project_id}
          options={[{ value: '', label: 'Selecione um projeto' }, ...projects.filter((p) => p.status !== 'arquivado' || p.id === meeting?.project_id).map((p) => ({ value: p.id, label: p.name }))]}
          onChange={(e) => setForm({ ...form, project_id: e.target.value })}
        />
        <Select
          label="Status *"
          value={form.status}
          options={MEETING_STATUSES.map((s) => ({ value: s, label: MEETING_STATUS_LABEL[s] }))}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        />
        <Input label="Data e hora *" type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
        <Select
          label="Duração *"
          value={String(form.duration_minutes)}
          options={durations.map((d) => ({ value: String(d), label: `${d} minutos` }))}
          onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
        />
        <Input label="Local ou link *" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <Input label="Participantes *" placeholder="Ana, Bruno, Time de Produto" value={participants} onChange={(e) => setParticipants(e.target.value)} />

        {/* Template picker */}
        <div className="sm:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-[#737373]">Pauta *</span>
            <button
              type="button"
              onClick={() => setShowTemplates((v) => !v)}
              className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] text-[#525252] hover:text-[#c9a227] transition-colors"
            >
              <LayoutTemplate className="h-3 w-3" />
              Usar template
            </button>
          </div>

          {showTemplates && (
            <div className="mb-3 grid grid-cols-2 gap-1.5 rounded-xl border border-[#262626] bg-[#0a0a0a] p-2 sm:grid-cols-4">
              {MEETING_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="rounded-lg border border-[#1f1f1f] bg-[#111111] px-2.5 py-2 text-left text-xs text-[#a3a3a3] transition-all hover:border-[#c9a227]/30 hover:text-[#f5f5f5]"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          )}

          <MarkdownEditor
            value={form.agenda}
            onChange={(v) => setForm({ ...form, agenda: v })}
            placeholder="Descreva os tópicos da reunião..."
            rows={5}
          />
        </div>

        <div className="sm:col-span-2">
          <MarkdownEditor
            label="Ata"
            value={form.minutes ?? ''}
            onChange={(v) => setForm({ ...form, minutes: v })}
            placeholder="Registre o que foi discutido..."
            rows={8}
          />
        </div>

        <div className="sm:col-span-2">
          <Textarea
            label="Próximos passos"
            rows={3}
            value={form.next_steps}
            onChange={(e) => setForm({ ...form, next_steps: e.target.value })}
          />
        </div>

        {error && <p className="text-xs text-[#ef4444] sm:col-span-2">{error}</p>}

        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="accent" loading={pending}>{meeting ? 'Salvar alterações' : 'Criar reunião e evento'}</Button>
        </div>
      </form>
    </Modal>
  )
}
