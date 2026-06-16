'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { createMeeting, updateMeeting, type MeetingInput } from '@/lib/actions/meetings'
import type { Meeting, Project } from '@/lib/supabase/types'
import { MEETING_STATUSES, MEETING_STATUS_LABEL } from './constants'

const durations = [15, 30, 45, 60, 90, 120]
const local = (iso?: string) => iso ? iso.slice(0, 16) : new Date(Date.now() + 3600000).toISOString().slice(0, 16)

export function MeetingFormModal({ open, meeting, projects, onClose, onSaved }: {
  open: boolean; meeting?: Meeting | null; projects: Project[]; onClose: () => void; onSaved: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [participants, setParticipants] = useState((meeting?.participants ?? []).join(', '))
  const [form, setForm] = useState<MeetingInput>({
    title: meeting?.title ?? '', description: meeting?.description ?? '', project_id: meeting?.project_id ?? '',
    scheduled_at: local(meeting?.scheduled_at), duration_minutes: meeting?.duration_minutes ?? 30,
    location: meeting?.location ?? '', participants: meeting?.participants ?? [], agenda: meeting?.agenda ?? '',
    minutes: meeting?.minutes ?? '', next_steps: meeting?.next_steps ?? '', status: meeting?.status ?? 'agendada',
  })
  function submit(event: React.FormEvent) {
    event.preventDefault(); setError('')
    const input = { ...form, participants: participants.split(',').map((item) => item.trim()).filter(Boolean) }
    startTransition(async () => {
      const result = meeting ? await updateMeeting(meeting.id, input) : await createMeeting(input)
      if (result.error) return setError(result.error)
      onSaved(); onClose()
    })
  }
  return <Modal open={open} onClose={onClose} title={meeting ? 'Editar reunião' : 'Nova reunião'} size="lg" className="max-h-[92vh] overflow-y-auto">
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><Input label="Título *" value={form.title} autoFocus onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
      <Select label="Projeto vinculado *" value={form.project_id} options={[{ value: '', label: 'Selecione um projeto' }, ...projects.filter((p) => p.status !== 'arquivado' || p.id === meeting?.project_id).map((p) => ({ value: p.id, label: p.name }))]} onChange={(e) => setForm({ ...form, project_id: e.target.value })} />
      <Select label="Status *" value={form.status} options={MEETING_STATUSES.map((s) => ({ value: s, label: MEETING_STATUS_LABEL[s] }))} onChange={(e) => setForm({ ...form, status: e.target.value })} />
      <Input label="Data e hora *" type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
      <Select label="Duração *" value={String(form.duration_minutes)} options={durations.map((d) => ({ value: String(d), label: `${d} minutos` }))} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
      <Input label="Local ou link *" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
      <Input label="Participantes *" placeholder="Ana, Bruno, Time de Produto" value={participants} onChange={(e) => setParticipants(e.target.value)} />
      <div className="sm:col-span-2"><Textarea label="Pauta *" rows={4} value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} /></div>
      <div className="sm:col-span-2"><Textarea label="Ata" rows={6} value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} /></div>
      <div className="sm:col-span-2"><Textarea label="Próximos passos" rows={3} value={form.next_steps} onChange={(e) => setForm({ ...form, next_steps: e.target.value })} /></div>
      {error && <p className="text-xs text-[#ef4444] sm:col-span-2">{error}</p>}
      <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" variant="accent" loading={pending}>{meeting ? 'Salvar alterações' : 'Criar reunião e evento'}</Button></div>
    </form>
  </Modal>
}
