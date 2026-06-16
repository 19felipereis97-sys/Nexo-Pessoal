'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createNote } from '@/lib/actions/notes'

interface AddNoteModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddNoteModal({ open, onClose, onSuccess }: AddNoteModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const handleClose = () => {
    if (isPending) return
    setError(null)
    setTitle('')
    setContent('')
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createNote(title, content)
      if (result.error) {
        setError(result.error)
      } else {
        onSuccess()
        handleClose()
      }
    })
  }

  return (
    <Modal open={open} onClose={handleClose} title="Nota rápida" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Título *"
          placeholder="Assunto da nota..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPending}
          autoFocus
        />

        <Textarea
          label="Conteúdo"
          placeholder="Escreva sua nota aqui..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isPending}
          rows={5}
        />

        {error && <p className="text-xs text-[#ef4444]">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" variant="accent" loading={isPending} className="flex-1">
            Salvar nota
          </Button>
        </div>
      </form>
    </Modal>
  )
}
