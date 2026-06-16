'use client'

import { useRouter } from 'next/navigation'
import { CalendarPlus, FolderOpen, Users } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

interface AddMeetingModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AddMeetingModal({ open, onClose }: AddMeetingModalProps) {
  const router = useRouter()
  function openMeetings() {
    onClose()
    router.push('/meetings')
  }
  return <Modal open={open} onClose={onClose} title="Nova reunião" description="Reuniões agora conectam projeto, agenda, decisões e tarefas.">
    <div className="flex flex-col gap-4">
      <div className="grid gap-2 text-xs text-[#737373] sm:grid-cols-3">
        <span className="rounded-lg border border-[#262626] p-3"><FolderOpen className="mb-2 h-4 w-4 text-[#c9a227]" />Vínculo obrigatório com projeto</span>
        <span className="rounded-lg border border-[#262626] p-3"><Users className="mb-2 h-4 w-4 text-[#c9a227]" />Participantes, pauta e ata</span>
        <span className="rounded-lg border border-[#262626] p-3"><CalendarPlus className="mb-2 h-4 w-4 text-[#c9a227]" />Evento automático na agenda</span>
      </div>
      <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button variant="accent" onClick={openMeetings}>Abrir criação completa</Button></div>
    </div>
  </Modal>
}
