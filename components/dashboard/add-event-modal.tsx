'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createCalendarEvent } from '@/lib/actions/events'
import { todayISO } from '@/lib/utils/date'

interface AddEventModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const typeOptions = [
  { value: 'reunião', label: 'Reunião' },
  { value: 'compromisso', label: 'Compromisso' },
  { value: 'evento', label: 'Evento' },
  { value: 'lembrete', label: 'Lembrete' },
  { value: 'bloqueio', label: 'Bloqueio de tempo' },
]

const defaultForm = () => {
  const t = todayISO()
  return { title: '', type: 'reunião', date: t, start_time: '09:00', end_time: '10:00', location: '', description: '' }
}

export function AddEventModal({ open, onClose, onSuccess }: AddEventModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)

  const handleClose = () => {
    if (isPending) return
    setError(null)
    setForm(defaultForm())
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.date || !form.start_time || !form.end_time) {
      setError('Data e horário são obrigatórios')
      return
    }
    const start_at = `${form.date}T${form.start_time}:00`
    const end_at = `${form.date}T${form.end_time}:00`
    if (end_at <= start_at) {
      setError('O horário de término deve ser depois do início')
      return
    }
    startTransition(async () => {
      const result = await createCalendarEvent({
        title: form.title,
        type: form.type,
        start_at,
        end_at,
        location: form.location || undefined,
        description: form.description || undefined,
      })
      if (result.error) {
        setError(result.error)
      } else {
        onSuccess()
        handleClose()
      }
    })
  }

  return (
    <Modal open={open} onClose={handleClose} title="Adicionar compromisso" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Título *"
          placeholder="Nome do compromisso..."
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          disabled={isPending}
          autoFocus
        />

        <Select
          label="Tipo"
          options={typeOptions}
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          disabled={isPending}
        />

        <Input
          label="Data *"
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          disabled={isPending}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Início *"
            type="time"
            value={form.start_time}
            onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
            disabled={isPending}
          />
          <Input
            label="Término *"
            type="time"
            value={form.end_time}
            onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
            disabled={isPending}
          />
        </div>

        <Input
          label="Local"
          placeholder="Onde será?"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          disabled={isPending}
        />

        <Textarea
          label="Descrição"
          placeholder="Detalhes adicionais..."
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          disabled={isPending}
          rows={2}
        />

        {error && <p className="text-xs text-[#ef4444]">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" variant="accent" loading={isPending} className="flex-1">
            Adicionar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
