'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, CheckSquare, FolderOpen, CalendarClock, Video, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PremiumTooltip } from '@/components/ui/premium-tooltip'
import { AddTaskModal } from './add-task-modal'
import { AddProjectModal } from './add-project-modal'
import { AddEventModal } from './add-event-modal'
import { AddMeetingModal } from './add-meeting-modal'
import { AddNoteModal } from './add-note-modal'

type CreateType = 'task' | 'project' | 'event' | 'meeting' | 'note' | null

const menuItems: { type: NonNullable<CreateType>; label: string; icon: typeof CheckSquare; shortcut: string }[] = [
  { type: 'task', label: 'Nova tarefa', icon: CheckSquare, shortcut: 'T' },
  { type: 'project', label: 'Novo projeto', icon: FolderOpen, shortcut: 'P' },
  { type: 'event', label: 'Novo compromisso', icon: CalendarClock, shortcut: 'C' },
  { type: 'meeting', label: 'Nova reunião', icon: Video, shortcut: 'R' },
  { type: 'note', label: 'Nova nota', icon: FileText, shortcut: 'N' },
]

export function QuickCreateMenu() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<CreateType>(null)

  const openModal = (type: CreateType) => {
    setOpen(false)
    setActive(type)
  }
  const closeModal = () => setActive(null)
  const handleSuccess = () => router.refresh()

  return (
    <>
      <div className="relative">
        <PremiumTooltip content="Criação rápida — tarefa, projeto, compromisso, reunião ou nota" side="bottom">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Criação rápida"
            aria-expanded={open}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200',
              open
                ? 'rotate-45 border-[#c9a227] bg-[#c9a227] text-[#050505]'
                : 'border-[#262626] bg-[#171717] text-[#f5f5f5] hover:border-[#c9a227]/40 hover:text-[#c9a227]',
            )}
          >
            {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </PremiumTooltip>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
            <div className="fixed right-2 top-14 z-50 w-52 rounded-xl border border-[#262626] bg-[#111111] p-1.5 shadow-2xl animate-in fade-in-0 slide-in-from-top-2 duration-150 sm:absolute sm:right-0 sm:top-11">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#525252]">Criar novo</p>
              {menuItems.map((item) => (
                <button
                  key={item.type}
                  onClick={() => openModal(item.type)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#a3a3a3] transition-all hover:bg-[#171717] hover:text-[#f5f5f5]"
                >
                  <item.icon className="h-4 w-4 shrink-0 text-[#737373]" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <kbd className="font-mono text-[10px] text-[#525252]">{item.shortcut}</kbd>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <AddTaskModal open={active === 'task'} onClose={closeModal} onSuccess={handleSuccess} />
      <AddProjectModal open={active === 'project'} onClose={closeModal} onSuccess={handleSuccess} />
      <AddEventModal open={active === 'event'} onClose={closeModal} onSuccess={handleSuccess} />
      <AddMeetingModal open={active === 'meeting'} onClose={closeModal} onSuccess={handleSuccess} />
      <AddNoteModal open={active === 'note'} onClose={closeModal} onSuccess={handleSuccess} />
    </>
  )
}
