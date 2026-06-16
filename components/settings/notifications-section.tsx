'use client'

import { useEffect, useRef, useState } from 'react'
import { saveNotificationSettings } from '@/lib/actions/settings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { NotificationSettings } from '@/lib/supabase/types'

interface Props {
  settings: NotificationSettings
}

function SettingsSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-200 ${
        checked ? 'border-[#c9a227] bg-[#c9a227]/20' : 'border-[#262626] bg-[#111]'
      }`}
    >
      <span className={`absolute h-3.5 w-3.5 rounded-full transition-all duration-200 ${
        checked ? 'left-4 bg-[#c9a227]' : 'left-0.5 bg-[#525252]'
      }`} />
    </button>
  )
}

function SwitchRow({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#f5f5f5]">{label}</p>
        {description && <p className="mt-0.5 text-xs text-[#737373]">{description}</p>}
      </div>
      <SettingsSwitch checked={checked} onChange={onChange} />
    </div>
  )
}

function SaveBar({ dirty, saving, success, error, onSave }: {
  dirty: boolean; saving: boolean; success: boolean; error: string | null; onSave: () => void
}) {
  if (!dirty && !success && !error) return null
  return (
    <div className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 ${
      error ? 'border-[#ef4444]/20 bg-[#ef4444]/5' : success ? 'border-[#22c55e]/20 bg-[#22c55e]/5' : 'border-[#c9a227]/20 bg-[#c9a227]/5'
    }`}>
      <span className={`text-sm ${error ? 'text-[#ef4444]' : success ? 'text-[#22c55e]' : 'text-[#c9a227]'}`}>
        {error ?? (success ? 'Salvo com sucesso.' : 'Você tem alterações não salvas.')}
      </span>
      {!success && !error && (
        <Button variant="accent" size="sm" loading={saving} onClick={onSave}>Salvar</Button>
      )}
    </div>
  )
}

const DAYS = [
  { value: 'monday', label: 'Segunda' },
  { value: 'tuesday', label: 'Terça' },
  { value: 'wednesday', label: 'Quarta' },
  { value: 'thursday', label: 'Quinta' },
  { value: 'friday', label: 'Sexta' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
]

export function NotificationsSection({ settings }: Props) {
  const [form, setForm] = useState({
    notify_task_due: settings.notify_task_due,
    notify_task_overdue: settings.notify_task_overdue,
    notify_meeting_reminder: settings.notify_meeting_reminder,
    notify_project_stalled: settings.notify_project_stalled,
    notify_routine_pending: settings.notify_routine_pending,
    notify_daily_summary: settings.notify_daily_summary,
    notify_weekly_review: settings.notify_weekly_review,
    daily_summary_time: settings.daily_summary_time ?? '08:00',
    weekly_review_day: settings.weekly_review_day ?? 'friday',
    weekly_review_time: settings.weekly_review_time ?? '17:00',
  })
  const initial = useRef(form)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // eslint-disable-next-line react-hooks/refs
  const dirty = JSON.stringify(form) !== JSON.stringify(initial.current)

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(false), 3000); return () => clearTimeout(t) } }, [success])

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }))
    setSuccess(false); setError(null)
  }

  async function handleSave() {
    setSaving(true); setError(null)
    const res = await saveNotificationSettings(form)
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setSuccess(true)
    initial.current = form
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader><CardTitle>Notificações</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-0 divide-y divide-[#1a1a1a] pt-2">
          <SwitchRow
            label="Tarefas com vencimento próximo"
            description="Alerta quando uma tarefa vence nas próximas 24h"
            checked={form.notify_task_due}
            onChange={(v) => set('notify_task_due', v)}
          />
          <SwitchRow
            label="Tarefas vencidas"
            description="Notifica sobre tarefas que já passaram do prazo"
            checked={form.notify_task_overdue}
            onChange={(v) => set('notify_task_overdue', v)}
          />
          <SwitchRow
            label="Lembrete de reunião"
            description="Aviso antes do início de reuniões agendadas"
            checked={form.notify_meeting_reminder}
            onChange={(v) => set('notify_meeting_reminder', v)}
          />
          <SwitchRow
            label="Projetos parados"
            description="Alerta quando um projeto fica sem atividade por muitos dias"
            checked={form.notify_project_stalled}
            onChange={(v) => set('notify_project_stalled', v)}
          />
          <SwitchRow
            label="Rotinas pendentes"
            description="Lembra de rotinas que não foram marcadas no dia"
            checked={form.notify_routine_pending}
            onChange={(v) => set('notify_routine_pending', v)}
          />
          <SwitchRow
            label="Resumo diário"
            description="Receba um resumo das suas tarefas e eventos do dia"
            checked={form.notify_daily_summary}
            onChange={(v) => set('notify_daily_summary', v)}
          />
          <SwitchRow
            label="Revisão semanal"
            description="Lembrete semanal para rever progresso e próximos passos"
            checked={form.notify_weekly_review}
            onChange={(v) => set('notify_weekly_review', v)}
          />
        </CardContent>
      </Card>

      {/* Horários */}
      <Card>
        <CardHeader><CardTitle>Horários das notificações</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3 pt-4">
          <div className={`grid gap-3 transition-opacity ${form.notify_daily_summary ? '' : 'opacity-40 pointer-events-none'}`}>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a3a3a3]">Horário do resumo diário</label>
              <input
                type="time"
                value={form.daily_summary_time}
                onChange={(e) => set('daily_summary_time', e.target.value)}
                className="h-9 rounded-lg border border-[#262626] bg-[#111] px-3 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227]/50"
              />
            </div>
          </div>

          <div className={`grid gap-3 sm:grid-cols-2 transition-opacity ${form.notify_weekly_review ? '' : 'opacity-40 pointer-events-none'}`}>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a3a3a3]">Dia da revisão semanal</label>
              <select
                value={form.weekly_review_day}
                onChange={(e) => set('weekly_review_day', e.target.value)}
                className="h-9 w-full rounded-lg border border-[#262626] bg-[#111] px-3 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227]/50"
              >
                {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a3a3a3]">Horário da revisão semanal</label>
              <input
                type="time"
                value={form.weekly_review_time}
                onChange={(e) => set('weekly_review_time', e.target.value)}
                className="h-9 rounded-lg border border-[#262626] bg-[#111] px-3 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227]/50"
              />
            </div>
          </div>

          <p className="text-xs text-[#525252]">
            As notificações dependem de integração com navegador ou aplicativo. Recursos de push serão ativados em versão futura.
          </p>
        </CardContent>
      </Card>

      <SaveBar dirty={dirty} saving={saving} success={success} error={error} onSave={handleSave} />
    </div>
  )
}
