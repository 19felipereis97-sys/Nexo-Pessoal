'use client'

import { useState, useTransition } from 'react'
import { Drawer } from '@/components/ui/drawer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-state'
import {
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  archiveRoutine,
  restoreRoutine,
  deleteRoutine,
} from '@/lib/actions/routines'
import { AREA_LABELS, FREQUENCY_LABELS, calcStreak, DAY_OPTIONS } from '@/lib/utils/routines'
import { formatDate } from '@/lib/utils/date'
import type { Routine, RoutineChecklistItem, RoutineLog } from '@/lib/supabase/types'
import { Check, Trash2, Plus, Archive, RotateCcw, Pencil, X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  routine: Routine | null
  checklistItems: RoutineChecklistItem[]
  logs: RoutineLog[]
  today: string
  onEdit: (routine: Routine) => void
}

export function RoutineDrawer({ open, onClose, routine, checklistItems, logs, today, onEdit }: Props) {
  const [newItemTitle, setNewItemTitle] = useState('')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [localChecklist, setLocalChecklist] = useState<RoutineChecklistItem[]>([])
  const [pending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Merge server items with local optimistic items
  const items = localChecklist.length
    ? localChecklist
    : checklistItems.filter((i) => i.routine_id === routine?.id).sort((a, b) => a.position - b.position)

  const routineLogs = logs.filter((l) => l.routine_id === routine?.id)
  const streak = routine ? calcStreak(routine, logs, today) : 0
  const totalCompletions = routineLogs.length
  const recentLogs = routineLogs.slice(0, 30)

  function handleAddItem() {
    if (!newItemTitle.trim() || !routine) return
    const title = newItemTitle.trim()
    setNewItemTitle('')
    startTransition(async () => {
      const pos = items.length
      const result = await addChecklistItem(routine.id, title, pos)
      if (result.error) setActionError(result.error)
      else setLocalChecklist([])
    })
  }

  function handleEditItem(item: RoutineChecklistItem) {
    setEditingItemId(item.id)
    setEditingTitle(item.title)
  }

  function handleSaveEdit(item: RoutineChecklistItem) {
    if (!editingTitle.trim()) return
    setEditingItemId(null)
    startTransition(async () => {
      const result = await updateChecklistItem(item.id, editingTitle)
      if (result.error) setActionError(result.error)
    })
  }

  function handleDeleteItem(id: string) {
    setLocalChecklist(items.filter((i) => i.id !== id))
    startTransition(async () => {
      const result = await deleteChecklistItem(id)
      if (result.error) { setActionError(result.error); setLocalChecklist([]) }
    })
  }

  async function handleArchive() {
    if (!routine) return
    const result = await archiveRoutine(routine.id)
    if (result.error) setActionError(result.error)
    else onClose()
  }

  async function handleRestore() {
    if (!routine) return
    const result = await restoreRoutine(routine.id)
    if (result.error) setActionError(result.error)
    else onClose()
  }

  async function handleDelete() {
    if (!routine) return
    const result = await deleteRoutine(routine.id)
    if (result.error) setActionError(result.error)
    else onClose()
  }

  if (!routine) return null

  const daysLabel = (() => {
    if (routine.frequency === 'semanal' || routine.frequency === 'personalizada') {
      return routine.days_of_week
        ?.map((d) => DAY_OPTIONS.find((o) => o.value === d)?.label ?? d)
        .join(', ') ?? ''
    }
    if (routine.frequency === 'mensal') {
      return (routine.days_of_week ?? []).map((d) => `Dia ${d}`).join(', ')
    }
    return null
  })()

  return (
    <Drawer open={open} onClose={onClose} title={routine.title} side="right" width="w-[420px]">
      <div className="flex flex-col gap-5 pb-6">
        {/* Meta */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="muted">{FREQUENCY_LABELS[routine.frequency] ?? routine.frequency}</Badge>
          {routine.area && <Badge variant="accent">{AREA_LABELS[routine.area] ?? routine.area}</Badge>}
          {routine.status === 'archived' && <Badge variant="warning">Arquivada</Badge>}
          {routine.target_time && (
            <Badge variant="muted">{routine.target_time.slice(0, 5)}</Badge>
          )}
        </div>

        {daysLabel && (
          <p className="text-xs text-[#737373]">{daysLabel}</p>
        )}

        {routine.description && (
          <p className="text-sm text-[#a3a3a3]">{routine.description}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-[#2a2a2a] bg-[#141414] p-3 text-center">
            <p className="text-lg font-semibold text-[#c9a227]">{streak}</p>
            <p className="text-xs text-[#737373]">Sequência</p>
          </div>
          <div className="rounded-lg border border-[#2a2a2a] bg-[#141414] p-3 text-center">
            <p className="text-lg font-semibold text-[#e5e5e5]">{totalCompletions}</p>
            <p className="text-xs text-[#737373]">Conclusões</p>
          </div>
          <div className="rounded-lg border border-[#2a2a2a] bg-[#141414] p-3 text-center">
            <p className="text-lg font-semibold text-[#e5e5e5]">{items.length}</p>
            <p className="text-xs text-[#737373]">Checklists</p>
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Checklist</h3>
          {items.length === 0 && (
            <p className="text-xs text-[#525252]">Nenhum item. Adicione abaixo.</p>
          )}
          {items.map((item) =>
            editingItemId === item.id ? (
              <div key={item.id} className="flex gap-2">
                <input
                  autoFocus
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(item); if (e.key === 'Escape') setEditingItemId(null) }}
                  className="flex-1 rounded border border-[#c9a227]/40 bg-[#141414] px-2 py-1 text-sm text-[#e5e5e5] focus:outline-none"
                />
                <button onClick={() => handleSaveEdit(item)} className="text-[#c9a227] hover:text-[#e5e5e5] text-xs">Ok</button>
                <button onClick={() => setEditingItemId(null)} className="text-[#525252] hover:text-[#e5e5e5]"><X className="h-3.5 w-3.5" /></button>
              </div>
            ) : (
              <div key={item.id} className="flex items-center gap-2 group">
                <span className="flex-1 text-sm text-[#e5e5e5]">{item.title}</span>
                <button onClick={() => handleEditItem(item)} className="opacity-0 group-hover:opacity-100 text-[#525252] hover:text-[#a3a3a3] transition-opacity">
                  <Pencil className="h-3 w-3" />
                </button>
                <button onClick={() => handleDeleteItem(item.id)} className="opacity-0 group-hover:opacity-100 text-[#525252] hover:text-red-400 transition-opacity">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )
          )}
          <div className="flex gap-2 pt-1">
            <input
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem() } }}
              placeholder="Novo item…"
              className="flex-1 rounded border border-[#2a2a2a] bg-[#141414] px-2 py-1.5 text-sm text-[#e5e5e5] placeholder:text-[#525252] focus:border-[#c9a227]/40 focus:outline-none"
            />
            <button
              onClick={handleAddItem}
              disabled={!newItemTitle.trim() || pending}
              className="rounded border border-[#2a2a2a] bg-[#1e1e1e] px-2 py-1.5 text-[#737373] hover:text-[#e5e5e5] disabled:opacity-40 transition-colors"
            >
              {pending ? <LoadingSpinner /> : <Plus className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* History */}
        {recentLogs.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Histórico recente</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-2 text-xs text-[#a3a3a3]">
                  <Check className="h-3 w-3 text-green-500 shrink-0" />
                  <span>{formatDate(log.reference_date)}</span>
                  {log.notes && <span className="text-[#525252] truncate">— {log.notes}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {actionError && (
          <p className="text-xs text-red-400 bg-red-950/20 border border-red-900/30 rounded px-3 py-2">{actionError}</p>
        )}

        {/* Actions */}
        <div className="border-t border-[#1e1e1e] pt-4 flex flex-col gap-2">
          <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => onEdit(routine)}>
            <Pencil className="h-3.5 w-3.5 mr-2" />
            Editar rotina
          </Button>
          {routine.status === 'active' ? (
            <Button variant="ghost" size="sm" className="w-full justify-start text-[#737373] hover:text-[#e5e5e5]" onClick={handleArchive}>
              <Archive className="h-3.5 w-3.5 mr-2" />
              Arquivar
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="w-full justify-start text-[#737373] hover:text-[#e5e5e5]" onClick={handleRestore}>
              <RotateCcw className="h-3.5 w-3.5 mr-2" />
              Restaurar
            </Button>
          )}
          {confirmDelete ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
              <Button size="sm" className="flex-1 bg-red-900/30 text-red-400 hover:bg-red-900/50" onClick={handleDelete}>
                Confirmar exclusão
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" className="w-full justify-start text-red-400/70 hover:text-red-400" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Excluir
            </Button>
          )}
        </div>
      </div>
    </Drawer>
  )
}
