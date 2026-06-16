'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveUserSettings } from '@/lib/actions/settings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { UserSettings } from '@/lib/supabase/types'

interface Props {
  settings: UserSettings
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

const ACCENT_COLORS = [
  { value: 'gold', label: 'Dourado', hex: '#c9a227' },
  { value: 'blue', label: 'Azul', hex: '#3b82f6' },
  { value: 'emerald', label: 'Esmeralda', hex: '#10b981' },
  { value: 'violet', label: 'Violeta', hex: '#8b5cf6' },
  { value: 'rose', label: 'Rosa', hex: '#f43f5e' },
  { value: 'orange', label: 'Laranja', hex: '#f97316' },
]

const HOME_PAGES = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'today', label: 'Hoje' },
  { value: 'tasks', label: 'Tarefas' },
  { value: 'projects', label: 'Projetos' },
  { value: 'calendar', label: 'Agenda' },
]

const DENSITIES = [
  { value: 'compact', label: 'Compacto' },
  { value: 'comfortable', label: 'Confortável' },
  { value: 'spacious', label: 'Espaçoso' },
]

export function AppearanceSection({ settings }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    accent_color: settings.accent_color,
    dashboard_density: settings.dashboard_density,
    enable_tooltips: settings.enable_tooltips,
    enable_animations: settings.enable_animations,
    enable_quick_create: settings.enable_quick_create,
    default_home_page: settings.default_home_page,
    date_format: settings.date_format,
    time_format: settings.time_format,
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
    const res = await saveUserSettings(form)
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setSuccess(true)
    initial.current = form
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tema */}
      <Card>
        <CardHeader><CardTitle>Aparência</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-5 pt-4">
          {/* Tema é sempre escuro por ora */}
          <div className="flex items-center justify-between rounded-xl border border-[#262626] bg-[#0a0a0a] p-3">
            <div>
              <p className="text-sm font-medium text-[#f5f5f5]">Tema</p>
              <p className="text-xs text-[#737373]">Tema claro disponível em breve</p>
            </div>
            <span className="rounded-full border border-[#262626] bg-[#171717] px-3 py-1 text-xs text-[#a3a3a3]">Escuro</span>
          </div>

          {/* Cor de destaque */}
          <div>
            <p className="mb-2 text-xs font-medium text-[#a3a3a3]">Cor de destaque</p>
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => set('accent_color', c.value)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                    form.accent_color === c.value ? 'border-white scale-110' : 'border-transparent hover:border-white/30'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {form.accent_color === c.value && (
                    <span className="h-2 w-2 rounded-full bg-white/80" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Densidade */}
          <div>
            <p className="mb-2 text-xs font-medium text-[#a3a3a3]">Densidade do layout</p>
            <div className="flex gap-2">
              {DENSITIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => set('dashboard_density', d.value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${
                    form.dashboard_density === d.value
                      ? 'border-[#c9a227]/50 bg-[#c9a227]/10 text-[#c9a227]'
                      : 'border-[#262626] bg-[#0a0a0a] text-[#737373] hover:border-[#333] hover:text-[#a3a3a3]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Divisor */}
          <div className="border-t border-[#1a1a1a]" />

          {/* Toggles */}
          <SwitchRow
            label="Tooltips"
            description="Exibe dicas ao passar o mouse sobre elementos"
            checked={form.enable_tooltips}
            onChange={(v) => set('enable_tooltips', v)}
          />
          <SwitchRow
            label="Animações"
            description="Transições e efeitos visuais ao interagir"
            checked={form.enable_animations}
            onChange={(v) => set('enable_animations', v)}
          />
          <SwitchRow
            label="Criação rápida"
            description="Atalhos flutuantes para criar itens rapidamente"
            checked={form.enable_quick_create}
            onChange={(v) => set('enable_quick_create', v)}
          />
        </CardContent>
      </Card>

      {/* Preferências do sistema */}
      <Card>
        <CardHeader><CardTitle>Preferências do sistema</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a3a3a3]">Página inicial</label>
              <select
                value={form.default_home_page}
                onChange={(e) => set('default_home_page', e.target.value)}
                className="h-9 w-full rounded-lg border border-[#262626] bg-[#111] px-3 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227]/50"
              >
                {HOME_PAGES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a3a3a3]">Formato de data</label>
              <select
                value={form.date_format}
                onChange={(e) => set('date_format', e.target.value)}
                className="h-9 w-full rounded-lg border border-[#262626] bg-[#111] px-3 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227]/50"
              >
                <option value="dd/MM/yyyy">DD/MM/AAAA</option>
                <option value="MM/dd/yyyy">MM/DD/AAAA</option>
                <option value="yyyy-MM-dd">AAAA-MM-DD</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a3a3a3]">Formato de hora</label>
              <select
                value={form.time_format}
                onChange={(e) => set('time_format', e.target.value)}
                className="h-9 w-full rounded-lg border border-[#262626] bg-[#111] px-3 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227]/50"
              >
                <option value="24h">24 horas (14:30)</option>
                <option value="12h">12 horas (2:30 PM)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <SaveBar dirty={dirty} saving={saving} success={success} error={error} onSave={handleSave} />
    </div>
  )
}
