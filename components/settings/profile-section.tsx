'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { saveProfile, sendPasswordReset } from '@/lib/actions/settings'
import { signOut } from '@/lib/auth/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { PremiumTooltip } from '@/components/ui/premium-tooltip'
import type { Profile } from '@/lib/supabase/types'

const TIMEZONES = [
  'America/Sao_Paulo', 'America/Manaus', 'America/Belem', 'America/Fortaleza',
  'America/Recife', 'America/Cuiaba', 'America/Porto_Velho', 'America/Boa_Vista',
  'America/Rio_Branco', 'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'Europe/Lisbon', 'Europe/London', 'Europe/Berlin', 'UTC',
]

const LOCALES = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Español' },
]

interface Props {
  profile: Profile | null
  authEmail: string | null
  authCreatedAt: string | null
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
        <Button variant="accent" size="sm" loading={saving} onClick={onSave}>
          Salvar alterações
        </Button>
      )}
    </div>
  )
}

export function ProfileSection({ profile, authEmail, authCreatedAt }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    role: profile?.role ?? '',
    timezone: profile?.timezone ?? 'America/Sao_Paulo',
    locale: profile?.locale ?? 'pt-BR',
    avatar_url: profile?.avatar_url ?? '',
  })
  const [initialForm, setInitialForm] = useState(form)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pwSent, setPwSent] = useState(false)
  const [pwSending, setPwSending] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm)

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(false), 3000)
      return () => clearTimeout(t)
    }
  }, [success])

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }))
      setSuccess(false)
      setError(null)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const res = await saveProfile(form)
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setSuccess(true)
    setInitialForm(form)
    router.refresh()
  }

  async function handlePasswordReset() {
    setPwSending(true)
    await sendPasswordReset()
    setPwSending(false)
    setPwSent(true)
  }

  const initials = (form.full_name || authEmail || '?').substring(0, 2).toUpperCase()

  return (
    <div className="flex flex-col gap-4">
      {/* Perfil */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-4 w-4 text-[#c9a227]" /> Informações do perfil</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {form.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.avatar_url} alt={form.full_name} className="h-16 w-16 rounded-full object-cover border border-[#262626]" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#262626] bg-[#c9a227]/20 text-xl font-bold text-[#c9a227]">
                  {initials}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#f5f5f5]">{form.full_name || authEmail}</p>
              <p className="text-xs text-[#737373]">{authEmail}</p>
              <p className="mt-0.5 text-xs text-[#525252]">{form.role || 'Sem cargo definido'}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nome completo" value={form.full_name} onChange={field('full_name')} placeholder="Seu nome" />
            <Input label="Cargo / função" value={form.role} onChange={field('role')} placeholder="Ex: Gerente, Desenvolvedor" />
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a3a3a3]">Fuso horário</label>
              <select value={form.timezone} onChange={field('timezone')} className="h-9 w-full rounded-lg border border-[#262626] bg-[#111] px-3 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227]/50">
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#a3a3a3]">Idioma</label>
              <select value={form.locale} onChange={field('locale')} className="h-9 w-full rounded-lg border border-[#262626] bg-[#111] px-3 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227]/50">
                {LOCALES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <PremiumTooltip title="URL do avatar" content="Cole o link de uma imagem. Futuramente será possível fazer upload direto." side="top">
                <Input label="URL do avatar (opcional)" value={form.avatar_url} onChange={field('avatar_url')} placeholder="https://..." />
              </PremiumTooltip>
            </div>
          </div>

          <SaveBar dirty={dirty} saving={saving} success={success} error={error} onSave={handleSave} />
        </CardContent>
      </Card>

      {/* Conta e acesso */}
      <Card>
        <CardHeader><CardTitle>Conta e acesso</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-[#737373]">E-mail</p>
              <p className="mt-0.5 font-medium text-[#f5f5f5]">{authEmail ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-[#737373]">Membro desde</p>
              <p className="mt-0.5 font-medium text-[#f5f5f5]">
                {authCreatedAt ? new Date(authCreatedAt).toLocaleDateString('pt-BR', { dateStyle: 'long' }) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#737373]">Status da conta</p>
              <span className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-[#22c55e]/20 bg-[#22c55e]/10 px-2 py-0.5 text-xs text-[#22c55e]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" /> Ativa
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-[#1a1a1a] pt-4">
            <Button variant="secondary" size="sm" onClick={() => setShowPasswordModal(true)}>
              Alterar senha
            </Button>
            <Button variant="ghost" size="sm" className="text-[#ef4444] hover:bg-[#ef4444]/10" onClick={() => setShowLogoutModal(true)}>
              <LogOut className="h-3.5 w-3.5" /> Sair da conta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password modal */}
      <Modal open={showPasswordModal} onClose={() => { setShowPasswordModal(false); setPwSent(false) }} title="Alterar senha" size="sm">
        {pwSent ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/5 p-4 text-sm text-[#22c55e]">
              E-mail de redefinição de senha enviado para <strong>{authEmail}</strong>. Verifique sua caixa de entrada.
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => { setShowPasswordModal(false); setPwSent(false) }}>Fechar</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[#a3a3a3]">
              Um link de redefinição de senha será enviado para <strong className="text-[#f5f5f5]">{authEmail}</strong>.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowPasswordModal(false)}>Cancelar</Button>
              <Button variant="accent" loading={pwSending} onClick={handlePasswordReset}>
                Enviar link
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Logout modal */}
      <Modal open={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Sair da conta" size="sm">
        <p className="text-sm text-[#a3a3a3]">Tem certeza que deseja sair? Você precisará fazer login novamente.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setShowLogoutModal(false)}>Cancelar</Button>
          <Button variant="danger" onClick={() => signOut()}>Sair</Button>
        </div>
      </Modal>
    </div>
  )
}
