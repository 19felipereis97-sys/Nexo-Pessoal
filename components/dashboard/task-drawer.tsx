'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Circle, Clock, Calendar, AlertTriangle, Loader2 } from 'lucide-react'
import { Drawer } from '@/components/ui/drawer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { toggleTaskComplete } from '@/lib/actions/tasks'
import { formatDateShort, daysOverdue } from '@/lib/utils/date'
import type { Task } from '@/lib/supabase/types'

interface TaskDrawerProps {
  task: Task | null
  onClose: () => void
  onRefresh: () => void
}

const priorityConfig: Record<string, { label: string; variant: 'danger' | 'warning' | 'muted' | 'accent'; tooltip: string }> = {
  critica: { label: 'Crítica', variant: 'danger', tooltip: 'Prioridade máxima — requer ação imediata' },
  urgente: { label: 'Urgente', variant: 'danger', tooltip: 'Prioridade máxima — requer ação imediata' },
  alta: { label: 'Alta', variant: 'danger', tooltip: 'Alta prioridade — deve ser feita hoje' },
  média: { label: 'Média', variant: 'warning', tooltip: 'Prioridade média — importante mas não urgente' },
  baixa: { label: 'Baixa', variant: 'muted', tooltip: 'Baixa prioridade — pode ser adiada' },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  backlog: { label: 'Backlog', color: 'text-[#737373]' },
  'a-fazer': { label: 'A fazer', color: 'text-[#60a5fa]' },
  'em-andamento': { label: 'Em andamento', color: 'text-[#c9a227]' },
  aguardando: { label: 'Aguardando', color: 'text-[#a78bfa]' },
  concluida: { label: 'Concluída', color: 'text-[#22c55e]' },
  'em andamento': { label: 'Em andamento', color: 'text-[#c9a227]' },
  revisão: { label: 'Em revisão', color: 'text-[#a3a3a3]' },
  concluído: { label: 'Concluído', color: 'text-[#22c55e]' },
  cancelado: { label: 'Cancelado', color: 'text-[#ef4444]' },
}

export function TaskDrawer({ task, onClose, onRefresh }: TaskDrawerProps) {
  const [isPending, startTransition] = useTransition()
  const [localDone, setLocalDone] = useState(task?.status === 'concluida')
  const [feedback, setFeedback] = useState<string | null>(null)

  if (!task) return null

  const isDone = localDone
  const priority = priorityConfig[task.priority] ?? priorityConfig['média']
  const status = statusConfig[task.status] ?? statusConfig['backlog']
  const overdueDays = task.due_date ? daysOverdue(task.due_date) : 0
  const isOverdue = overdueDays > 0 && !isDone

  const handleToggle = () => {
    const next = !localDone
    setLocalDone(next)
    setFeedback(null)
    startTransition(async () => {
      const result = await toggleTaskComplete(task.id, next)
      if (result.error) {
        setLocalDone(!next)
        setFeedback(result.error)
      } else {
        onRefresh()
      }
    })
  }

  return (
    <Drawer open={!!task} onClose={onClose} title="Detalhes da tarefa" width="w-full sm:w-[420px]">
      <div className="flex flex-col gap-5">
        {/* Título e toggle */}
        <div className="flex items-start gap-3">
          <Tooltip content={isDone ? 'Marcar como pendente' : 'Marcar como concluída'} side="left">
            <button
              onClick={handleToggle}
              disabled={isPending}
              className="mt-0.5 shrink-0 transition-all hover:scale-110 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#c9a227]" />
              ) : isDone ? (
                <CheckCircle2 className="h-5 w-5 text-[#22c55e]" />
              ) : (
                <Circle className="h-5 w-5 text-[#333] hover:text-[#c9a227]" />
              )}
            </button>
          </Tooltip>
          <h3 className={`text-base font-semibold leading-snug ${isDone ? 'line-through text-[#737373]' : 'text-[#f5f5f5]'}`}>
            {task.title}
          </h3>
        </div>

        {feedback && (
          <div className="rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/5 px-3 py-2 text-sm text-[#ef4444]">
            {feedback}
          </div>
        )}

        {/* Metadados */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between py-2 border-b border-[#1a1a1a]">
            <span className="text-xs text-[#737373]">Status</span>
            <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-[#1a1a1a]">
            <span className="text-xs text-[#737373]">Prioridade</span>
            <Tooltip content={priority.tooltip} side="left">
              <Badge variant={priority.variant}>{priority.label}</Badge>
            </Tooltip>
          </div>

          {task.due_date && (
            <div className="flex items-center justify-between py-2 border-b border-[#1a1a1a]">
              <span className="text-xs text-[#737373] flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Vencimento
              </span>
              <div className="flex items-center gap-2">
                {isOverdue && (
                  <Tooltip content={`${overdueDays} dia${overdueDays > 1 ? 's' : ''} em atraso`} side="left">
                    <AlertTriangle className="h-3.5 w-3.5 text-[#ef4444]" />
                  </Tooltip>
                )}
                <span className={`text-xs font-medium ${isOverdue ? 'text-[#ef4444]' : 'text-[#f5f5f5]'}`}>
                  {formatDateShort(task.due_date)}
                  {task.due_time && ` às ${task.due_time.slice(0, 5)}`}
                </span>
              </div>
            </div>
          )}

          {task.due_time && !task.due_date && (
            <div className="flex items-center justify-between py-2 border-b border-[#1a1a1a]">
              <span className="text-xs text-[#737373] flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Horário
              </span>
              <span className="text-xs font-medium text-[#f5f5f5]">{task.due_time.slice(0, 5)}</span>
            </div>
          )}

          <div className="flex items-center justify-between py-2 border-b border-[#1a1a1a]">
            <span className="text-xs text-[#737373]">Criada em</span>
            <span className="text-xs text-[#a3a3a3]">
              {new Date(task.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Descrição */}
        {task.description && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-[#737373]">Descrição</p>
            <p className="text-sm text-[#a3a3a3] leading-relaxed whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        {!task.description && (
          <p className="text-xs text-[#737373] italic">Sem descrição.</p>
        )}

        {/* Ações */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#262626]">
          <Button
            variant={isDone ? 'secondary' : 'accent'}
            onClick={handleToggle}
            loading={isPending}
            className="w-full"
          >
            {isDone ? 'Marcar como pendente' : 'Marcar como concluída'}
          </Button>
          <Button variant="ghost" className="w-full text-[#737373]" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Drawer>
  )
}
