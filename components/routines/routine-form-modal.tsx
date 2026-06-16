'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createRoutine, updateRoutine, type RoutineFields } from '@/lib/actions/routines'
import { AREA_LABELS, FREQUENCY_LABELS, DAY_OPTIONS } from '@/lib/utils/routines'
import type { Project, Routine } from '@/lib/supabase/types'

interface Props {
  open: boolean
  onClose: () => void
  routine?: Routine | null
  projects: Array<Pick<Project, 'id' | 'name'>>
}

function buildDefault(routine?: Routine | null): RoutineFields & { description: string } {
  return {
    title: routine?.title ?? '',
    description: routine?.description ?? '',
    frequency: routine?.frequency ?? 'diaria',
    days_of_week: routine?.days_of_week ?? [],
    target_time: routine?.target_time ?? '',
    area: routine?.area ?? '',
    project_id: routine?.project_id ?? null,
  }
}

export function RoutineFormModal({ open, onClose, routine, projects }: Props) {
  const isEdit = !!routine
  const [form, setForm] = useState(buildDefault(routine))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  function toggleDay(day: string) {
    const days = form.days_of_week ?? []
    set('days_of_week', days.includes(day) ? days.filter((d) => d !== day) : [...days, day])
  }

  const needsDays = form.frequency === 'semanal' || form.frequency === 'personalizada'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Título é obrigatório'); return }
    if (needsDays && !form.days_of_week?.length) { setError('Selecione ao menos um dia'); return }
    setSaving(true)
    setError(null)
    const result = isEdit
      ? await updateRoutine(routine!.id, form)
      : await createRoutine(form)
    setSaving(false)
    if (result.error) { setError(result.error); return }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar rotina' : 'Nova rotina'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Título"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Ex: Revisão matinal"
          required
        />

        <div className="space-y-1">
          <label className="text-xs font-medium text-[#a3a3a3]">Descrição</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Detalhes opcionais…"
            rows={2}
            className="w-full rounded-md border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-sm text-[#e5e5e5] placeholder:text-[#525252] focus:border-[#c9a227] focus:outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#a3a3a3]">Frequência</label>
            <select
              value={form.frequency}
              onChange={(e) => set('frequency', e.target.value)}
              className="w-full rounded-md border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-sm text-[#e5e5e5] focus:border-[#c9a227] focus:outline-none"
            >
              {Object.entries(FREQUENCY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <Input
            label="Horário"
            type="time"
            value={form.target_time ?? ''}
            onChange={(e) => set('target_time', e.target.value)}
          />
        </div>

        {needsDays && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#a3a3a3]">Dias da semana</label>
            <div className="flex gap-1.5 flex-wrap">
              {DAY_OPTIONS.map((d) => {
                const active = form.days_of_week?.includes(d.value)
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      active
                        ? 'bg-[#c9a227] text-black'
                        : 'bg-[#1e1e1e] text-[#737373] hover:text-[#e5e5e5]'
                    }`}
                  >
                    {d.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {form.frequency === 'mensal' && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#a3a3a3]">Dias do mês (ex: 1, 15)</label>
            <Input
              value={(form.days_of_week ?? []).join(', ')}
              onChange={(e) => {
                const vals = e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                set('days_of_week', vals)
              }}
              placeholder="1, 15, 30"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#a3a3a3]">Área de vida</label>
            <select
              value={form.area ?? ''}
              onChange={(e) => set('area', e.target.value)}
              className="w-full rounded-md border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-sm text-[#e5e5e5] focus:border-[#c9a227] focus:outline-none"
            >
              <option value="">Sem área</option>
              {Object.entries(AREA_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#a3a3a3]">Projeto</label>
            <select
              value={form.project_id ?? ''}
              onChange={(e) => set('project_id', e.target.value || null)}
              className="w-full rounded-md border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-sm text-[#e5e5e5] focus:border-[#c9a227] focus:outline-none"
            >
              <option value="">Sem projeto</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-950/20 border border-red-900/30 rounded px-3 py-2">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="accent" size="sm" disabled={saving}>
            {saving ? 'Salvando…' : isEdit ? 'Salvar' : 'Criar rotina'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
