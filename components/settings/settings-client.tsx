'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell, Calendar, ChevronRight, FileText, Info, Layout, Lock, PlugZap, Shield, Sliders, Sparkles, User
} from 'lucide-react'
import { saveUserSettings, saveSecuritySettings } from '@/lib/actions/settings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProfileSection } from './profile-section'
import { AppearanceSection } from './appearance-section'
import { NotificationsSection } from './notifications-section'
import { IntegrationsSection } from './integrations-section'
import { PrivacySection } from './privacy-section'
import type { SettingsData } from '@/lib/data/settings'
import type { UserSettings } from '@/lib/supabase/types'

// ─── Shared primitives ──────────────────────────────────────────────────────

export function SettingsSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
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

// ─── Inline sections (simpler panels) ──────────────────────────────────────

function CalendarSection({ settings }: { settings: UserSettings }) {
  const router = useRouter()
  const [form, setForm] = useState({
    default_calendar_view: settings.default_calendar_view,
    calendar_start_hour: settings.calendar_start_hour,
    calendar_end_hour: settings.calendar_end_hour,
    calendar_default_duration: settings.calendar_default_duration,
    calendar_show_weekends: settings.calendar_show_weekends,
    week_starts_on: settings.week_starts_on,
  })
  const initial = useRef(form)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // eslint-disable-next-line react-hooks/refs
  const dirty = JSON.stringify(form) !== JSON.stringify(initial.current)

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(false), 3000); return () => clearTimeout(t) } }, [success])

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v })); setSuccess(false); setError(null)
  }

  async function handleSave() {
    setSaving(true); setError(null)
    const res = await saveUserSettings(form)
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setSuccess(true); initial.current = form; router.refresh()
  }

  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader><CardTitle>Agenda</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a3a3a3]">Vista padrão</label>
              <select value={form.default_calendar_view} onChange={(e) => set('default_calendar_view', e.target.value)} className="h-9 w-full rounded-lg border border-[#262626] bg-[#111] px-3 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227]/50">
                <option value="day">Dia</option>
                <option value="week">Semana</option>
                <option value="month">Mês</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a3a3a3]">Semana começa em</label>
              <select value={form.week_starts_on} onChange={(e) => set('week_starts_on', e.target.value)} className="h-9 w-full rounded-lg border border-[#262626] bg-[#111] px-3 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227]/50">
                <option value="monday">Segunda-feira</option>
                <option value="sunday">Domingo</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a3a3a3]">Hora início do dia</label>
              <select value={form.calendar_start_hour} onChange={(e) => set('calendar_start_hour', Number(e.target.value))} className="h-9 w-full rounded-lg border border-[#262626] bg-[#111] px-3 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227]/50">
                {hours.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a3a3a3]">Hora fim do dia</label>
              <select value={form.calendar_end_hour} onChange={(e) => set('calendar_end_hour', Number(e.target.value))} className="h-9 w-full rounded-lg border border-[#262626] bg-[#111] px-3 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227]/50">
                {hours.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a3a3a3]">Duração padrão (min)</label>
              <select value={form.calendar_default_duration} onChange={(e) => set('calendar_default_duration', Number(e.target.value))} className="h-9 w-full rounded-lg border border-[#262626] bg-[#111] px-3 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227]/50">
                {[15, 30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
          </div>
          <div className="border-t border-[#1a1a1a] pt-2">
            <SwitchRow
              label="Mostrar finais de semana"
              description="Exibe sábado e domingo na visualização semanal"
              checked={form.calendar_show_weekends}
              onChange={(v) => set('calendar_show_weekends', v)}
            />
          </div>
        </CardContent>
      </Card>
      <SaveBar dirty={dirty} saving={saving} success={success} error={error} onSave={handleSave} />
    </div>
  )
}

function TasksSection({ settings }: { settings: UserSettings }) {
  const router = useRouter()
  const [form, setForm] = useState({
    default_task_view: settings.default_task_view,
    task_default_priority: settings.task_default_priority,
    task_show_completed: settings.task_show_completed,
    project_stale_days: settings.project_stale_days,
  })
  const initial = useRef(form)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // eslint-disable-next-line react-hooks/refs
  const dirty = JSON.stringify(form) !== JSON.stringify(initial.current)

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(false), 3000); return () => clearTimeout(t) } }, [success])

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v })); setSuccess(false); setError(null)
  }

  async function handleSave() {
    setSaving(true); setError(null)
    const res = await saveUserSettings(form)
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setSuccess(true); initial.current = form; router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader><CardTitle>Tarefas e Projetos</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a3a3a3]">Vista padrão de tarefas</label>
              <select value={form.default_task_view} onChange={(e) => set('default_task_view', e.target.value)} className="h-9 w-full rounded-lg border border-[#262626] bg-[#111] px-3 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227]/50">
                <option value="kanban">Kanban</option>
                <option value="list">Lista</option>
                <option value="table">Tabela</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a3a3a3]">Prioridade padrão</label>
              <select value={form.task_default_priority} onChange={(e) => set('task_default_priority', e.target.value)} className="h-9 w-full rounded-lg border border-[#262626] bg-[#111] px-3 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227]/50">
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a3a3a3]">Dias para projeto parado</label>
              <select value={form.project_stale_days} onChange={(e) => set('project_stale_days', Number(e.target.value))} className="h-9 w-full rounded-lg border border-[#262626] bg-[#111] px-3 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227]/50">
                {[7, 10, 14, 21, 30].map((d) => <option key={d} value={d}>{d} dias</option>)}
              </select>
            </div>
          </div>
          <div className="border-t border-[#1a1a1a] pt-2">
            <SwitchRow
              label="Mostrar tarefas concluídas"
              description="Exibe tarefas finalizadas junto às ativas por padrão"
              checked={form.task_show_completed}
              onChange={(v) => set('task_show_completed', v)}
            />
          </div>
        </CardContent>
      </Card>
      <SaveBar dirty={dirty} saving={saving} success={success} error={error} onSave={handleSave} />
    </div>
  )
}

function DocumentsSection({ settings }: { settings: UserSettings }) {
  const router = useRouter()
  const [form, setForm] = useState({
    doc_default_category: settings.doc_default_category ?? '',
    doc_show_archived: settings.doc_show_archived,
  })
  const initial = useRef(form)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // eslint-disable-next-line react-hooks/refs
  const dirty = JSON.stringify(form) !== JSON.stringify(initial.current)

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(false), 3000); return () => clearTimeout(t) } }, [success])

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v })); setSuccess(false); setError(null)
  }

  async function handleSave() {
    setSaving(true); setError(null)
    const res = await saveUserSettings({ doc_default_category: form.doc_default_category || null, doc_show_archived: form.doc_show_archived })
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setSuccess(true); initial.current = form; router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader><CardTitle>Documentos</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4 pt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#a3a3a3]">Categoria padrão</label>
            <select value={form.doc_default_category} onChange={(e) => set('doc_default_category', e.target.value)} className="h-9 w-full rounded-lg border border-[#262626] bg-[#111] px-3 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227]/50">
              <option value="">Nenhuma (sem categoria padrão)</option>
              <option value="contrato">Contrato</option>
              <option value="relatorio">Relatório</option>
              <option value="proposta">Proposta</option>
              <option value="financeiro">Financeiro</option>
              <option value="rh">RH</option>
              <option value="juridico">Jurídico</option>
              <option value="tecnico">Técnico</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div className="border-t border-[#1a1a1a] pt-2">
            <SwitchRow
              label="Mostrar arquivados por padrão"
              description="Exibe documentos arquivados junto aos ativos na listagem"
              checked={form.doc_show_archived}
              onChange={(v) => set('doc_show_archived', v)}
            />
          </div>
        </CardContent>
      </Card>
      <SaveBar dirty={dirty} saving={saving} success={success} error={error} onSave={handleSave} />
    </div>
  )
}

function AssistantSection({ settings }: { settings: UserSettings }) {
  const router = useRouter()
  const [form, setForm] = useState({
    assistant_enabled: settings.assistant_enabled,
    assistant_daily_summary: settings.assistant_daily_summary,
    assistant_weekly_review: settings.assistant_weekly_review,
    assistant_tone: settings.assistant_tone,
    assistant_suggest_reschedule: settings.assistant_suggest_reschedule,
    assistant_generate_tasks: settings.assistant_generate_tasks,
    assistant_require_confirm: settings.assistant_require_confirm,
  })
  const initial = useRef(form)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // eslint-disable-next-line react-hooks/refs
  const dirty = JSON.stringify(form) !== JSON.stringify(initial.current)

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(false), 3000); return () => clearTimeout(t) } }, [success])

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v })); setSuccess(false); setError(null)
  }

  async function handleSave() {
    setSaving(true); setError(null)
    const res = await saveUserSettings(form)
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setSuccess(true); initial.current = form; router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#c9a227]" /> Assistente IA</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-0 divide-y divide-[#1a1a1a] pt-2">
          <SwitchRow label="Ativar assistente" description="Habilita o painel de assistência inteligente no sistema" checked={form.assistant_enabled} onChange={(v) => set('assistant_enabled', v)} />
          <div className={`transition-opacity ${form.assistant_enabled ? '' : 'opacity-40 pointer-events-none'}`}>
            <SwitchRow label="Resumo diário" description="Geração automática de resumo do seu dia" checked={form.assistant_daily_summary} onChange={(v) => set('assistant_daily_summary', v)} />
            <SwitchRow label="Revisão semanal" description="Relatório semanal gerado automaticamente" checked={form.assistant_weekly_review} onChange={(v) => set('assistant_weekly_review', v)} />
            <SwitchRow label="Sugerir reagendamentos" description="Propõe reagendamentos para tarefas vencidas" checked={form.assistant_suggest_reschedule} onChange={(v) => set('assistant_suggest_reschedule', v)} />
            <SwitchRow label="Gerar tarefas de reuniões" description="Extrai tarefas automaticamente das atas" checked={form.assistant_generate_tasks} onChange={(v) => set('assistant_generate_tasks', v)} />
            <SwitchRow label="Confirmar antes de criar" description="Pede confirmação antes de criar itens gerados pela IA" checked={form.assistant_require_confirm} onChange={(v) => set('assistant_require_confirm', v)} />
            <div className="py-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#a3a3a3]">Tom do assistente</label>
                <select value={form.assistant_tone} onChange={(e) => set('assistant_tone', e.target.value)} className="h-9 w-full rounded-lg border border-[#262626] bg-[#111] px-3 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227]/50">
                  <option value="objetivo">Objetivo e direto</option>
                  <option value="motivacional">Motivacional</option>
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <SaveBar dirty={dirty} saving={saving} success={success} error={error} onSave={handleSave} />
    </div>
  )
}

function SecuritySection({ data }: { data: SettingsData }) {
  const router = useRouter()
  const security = data.securitySettings
  const [form, setForm] = useState({
    session_timeout_minutes: security?.session_timeout_minutes ?? 120,
    login_alerts_enabled: security?.login_alerts_enabled ?? true,
  })
  const initial = useRef(form)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // eslint-disable-next-line react-hooks/refs
  const dirty = JSON.stringify(form) !== JSON.stringify(initial.current)

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(false), 3000); return () => clearTimeout(t) } }, [success])

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v })); setSuccess(false); setError(null)
  }

  async function handleSave() {
    setSaving(true); setError(null)
    const res = await saveSecuritySettings(form)
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setSuccess(true); initial.current = form; router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4 text-[#c9a227]" /> Segurança</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4 pt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#a3a3a3]">Timeout de sessão</label>
            <select value={form.session_timeout_minutes} onChange={(e) => set('session_timeout_minutes', Number(e.target.value))} className="h-9 w-full rounded-lg border border-[#262626] bg-[#111] px-3 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227]/50">
              <option value={30}>30 minutos</option>
              <option value={60}>1 hora</option>
              <option value={120}>2 horas</option>
              <option value={480}>8 horas</option>
              <option value={1440}>24 horas</option>
              <option value={0}>Nunca expirar</option>
            </select>
          </div>
          <div className="border-t border-[#1a1a1a] pt-2">
            <SwitchRow
              label="Alertas de login"
              description="Notifica por e-mail quando um novo acesso é detectado"
              checked={form.login_alerts_enabled}
              onChange={(v) => set('login_alerts_enabled', v)}
            />
          </div>
          {/* 2FA placeholder */}
          <div className="flex items-center justify-between rounded-xl border border-[#262626] bg-[#0a0a0a] p-3">
            <div>
              <p className="text-sm font-medium text-[#f5f5f5]">Autenticação em dois fatores (2FA)</p>
              <p className="text-xs text-[#737373]">Disponível em versão futura</p>
            </div>
            <span className="rounded-full border border-[#262626] bg-[#171717] px-2 py-0.5 text-xs text-[#525252]">Em breve</span>
          </div>
        </CardContent>
      </Card>
      <SaveBar dirty={dirty} saving={saving} success={success} error={error} onSave={handleSave} />
    </div>
  )
}

function AboutSection() {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Info className="h-4 w-4 text-[#c9a227]" /> Sobre o Nexo Pessoal</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-4 pt-4">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-[#737373]">Versão</p>
            <p className="mt-0.5 font-medium text-[#f5f5f5]">1.0.0</p>
          </div>
          <div>
            <p className="text-xs text-[#737373]">Framework</p>
            <p className="mt-0.5 font-medium text-[#f5f5f5]">Next.js + Supabase</p>
          </div>
          <div>
            <p className="text-xs text-[#737373]">Banco de dados</p>
            <p className="mt-0.5 font-medium text-[#f5f5f5]">PostgreSQL (Supabase)</p>
          </div>
          <div>
            <p className="text-xs text-[#737373]">Ambiente</p>
            <p className="mt-0.5 font-medium text-[#f5f5f5]">Produção</p>
          </div>
        </div>
        <div className="border-t border-[#1a1a1a] pt-3">
          <p className="text-xs text-[#525252]">
            Nexo Pessoal é um sistema de gestão pessoal focado em produtividade, organização de projetos, tarefas, rotinas e reuniões. Desenvolvido com Next.js 16, Supabase e Tailwind CSS v4.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Navigation ──────────────────────────────────────────────────────────────

type SectionId =
  | 'perfil' | 'aparencia' | 'notificacoes' | 'agenda'
  | 'tarefas' | 'documentos' | 'assistente' | 'integracoes'
  | 'seguranca' | 'privacidade' | 'sobre'

interface NavItem {
  id: SectionId
  label: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { id: 'perfil', label: 'Perfil e Conta', icon: User },
  { id: 'aparencia', label: 'Aparência', icon: Layout },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'tarefas', label: 'Tarefas e Projetos', icon: Sliders },
  { id: 'documentos', label: 'Documentos', icon: FileText },
  { id: 'assistente', label: 'Assistente', icon: Sparkles },
  { id: 'integracoes', label: 'Integrações', icon: PlugZap },
  { id: 'seguranca', label: 'Segurança', icon: Lock },
  { id: 'privacidade', label: 'Dados e Privacidade', icon: Shield },
  { id: 'sobre', label: 'Sobre', icon: Info },
]

// ─── Main client component ───────────────────────────────────────────────────

interface Props { data: SettingsData }

export function SettingsClient({ data }: Props) {
  const [activeSection, setActiveSection] = useState<SectionId>('perfil')

  const userSettings = data.userSettings!
  const notificationSettings = data.notificationSettings!

  function renderSection() {
    switch (activeSection) {
      case 'perfil':
        return <ProfileSection profile={data.profile} authEmail={data.authEmail} authCreatedAt={data.authCreatedAt} />
      case 'aparencia':
        return <AppearanceSection settings={userSettings} />
      case 'notificacoes':
        return <NotificationsSection settings={notificationSettings} />
      case 'agenda':
        return <CalendarSection settings={userSettings} />
      case 'tarefas':
        return <TasksSection settings={userSettings} />
      case 'documentos':
        return <DocumentsSection settings={userSettings} />
      case 'assistente':
        return <AssistantSection settings={userSettings} />
      case 'integracoes':
        return <IntegrationsSection integrations={data.integrations} />
      case 'seguranca':
        return <SecuritySection data={data} />
      case 'privacidade':
        return <PrivacySection />
      case 'sobre':
        return <AboutSection />
      default:
        return null
    }
  }

  const activeNav = NAV_ITEMS.find((n) => n.id === activeSection)

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="border-b border-[#1a1a1a] px-4 py-4 sm:px-6">
        <h1 className="text-lg font-bold text-[#f5f5f5]">Configurações</h1>
        <p className="text-xs text-[#737373]">Gerencie suas preferências e configurações do sistema</p>
      </div>

      <div className="flex flex-1 flex-col gap-0 lg:flex-row">
        {/* Sidebar — desktop */}
        <aside className="hidden w-56 shrink-0 border-r border-[#1a1a1a] p-4 lg:block">
          <nav className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const active = activeSection === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-all ${
                    active
                      ? 'bg-[#c9a227]/10 text-[#c9a227] font-medium'
                      : 'text-[#a3a3a3] hover:bg-[#111] hover:text-[#f5f5f5]'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Mobile nav — horizontal scroll chips */}
        <div className="flex gap-2 overflow-x-auto border-b border-[#1a1a1a] p-3 lg:hidden">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = activeSection === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-all ${
                  active
                    ? 'border-[#c9a227]/40 bg-[#c9a227]/10 text-[#c9a227]'
                    : 'border-[#262626] text-[#737373] hover:text-[#a3a3a3]'
                }`}
              >
                <Icon className="h-3 w-3" />
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          {/* Breadcrumb on mobile */}
          <div className="mb-4 flex items-center gap-1.5 text-xs text-[#525252] lg:hidden">
            <span>Configurações</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#a3a3a3]">{activeNav?.label}</span>
          </div>

          <div className="mx-auto max-w-2xl">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  )
}
