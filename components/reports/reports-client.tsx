'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle, Archive, BarChart3, BookOpen, CalendarDays, CheckCircle2,
  ChevronLeft, ChevronRight, Clock, Download, FileText, Lightbulb,
  RotateCcw, Save, Sparkles, Target, Trash2, Users, Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/shared/page-header'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PremiumTooltip } from '@/components/ui/premium-tooltip'
import { saveWeeklyReview, saveReportReview, deleteReportReview } from '@/lib/actions/reports'
import { buildAutoReview, exportReportCSV } from '@/lib/utils/reports'
import { addDaysISO, addMonthsISO, formatTime, monthEndISO } from '@/lib/utils/date'
import { isRoutineForDay } from '@/lib/utils/routines'
import type { ReportData, PeriodType } from '@/lib/data/reports'
import type { CalendarEvent, Meeting, Note, Project, ProjectDecision, ReportReview, Routine, Task } from '@/lib/supabase/types'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReportsClientProps {
  data: ReportData
  periodStart: string
  periodEnd: string
  periodType: PeriodType
  projectId: string | null
}

// ─── Pure helpers ───────────────────────────────────────────────────────────────

function periodLabel(start: string, end: string, type: PeriodType): string {
  if (type === 'daily') {
    const [y, m, d] = start.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  }
  if (type === 'monthly') {
    const [y, m] = start.split('-').map(Number)
    return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }
  const [sy, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  const s = new Date(sy, sm - 1, sd).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  const e = new Date(ey, em - 1, ed).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  return `${s} – ${e}`
}

function focusMinutes(sessions: ReportData['focusSessions']): number {
  return sessions.reduce((acc, s) => {
    if (!s.ended_at) return acc
    return acc + Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000)
  }, 0)
}

function focusLabel(minutes: number): string {
  if (minutes === 0) return '0 min'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m}min`
}

function tasksByDay(tasks: Task[]): number[] {
  const counts = Array(7).fill(0)
  const dayMap: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short' })
  for (const t of tasks) {
    if (!t.completed_at) continue
    const key = fmt.format(new Date(t.completed_at))
    const idx = dayMap[key]
    if (idx !== undefined) counts[idx]++
  }
  return counts
}

function priorityVariant(priority: string): 'danger' | 'warning' | 'muted' {
  if (priority === 'critica' || priority === 'urgente') return 'danger'
  if (priority === 'alta') return 'warning'
  return 'muted'
}

function reviewTypeLabel(type: string): string {
  return { daily: 'Diária', weekly: 'Semanal', monthly: 'Mensal', custom: 'Personalizado' }[type] ?? type
}

// ─── Shared sub-components ──────────────────────────────────────────────────────

function MetricCard({ icon, label, value, sub, accent, tooltip }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; accent?: boolean; tooltip?: string
}) {
  const inner = (
    <Card className={accent ? 'border-[#c9a227]/25' : undefined}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#737373]">{label}</p>
            <p className={`mt-1.5 text-2xl font-bold tracking-tight ${accent ? 'text-[#c9a227]' : 'text-[#f5f5f5]'}`}>{value}</p>
            {sub && <p className="mt-1 text-xs text-[#737373]">{sub}</p>}
          </div>
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#262626] ${accent ? 'bg-[#c9a227]/10 text-[#c9a227]' : 'bg-[#0a0a0a] text-[#737373]'}`}>
            {icon}
          </span>
        </div>
      </CardContent>
    </Card>
  )
  if (!tooltip) return inner
  return (
    <PremiumTooltip title={label} content={tooltip} side="top">
      <div className="cursor-default">{inner}</div>
    </PremiumTooltip>
  )
}

function WeeklyBarChart({ tasks }: { tasks: Task[] }) {
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  const counts = tasksByDay(tasks)
  const max = Math.max(...counts, 1)
  return (
    <div className="flex items-end gap-2" style={{ height: '120px' }}>
      {days.map((day, i) => (
        <div key={day} className="flex flex-1 flex-col items-center gap-1">
          {counts[i] > 0 && <span className="text-[10px] font-medium text-[#c9a227]">{counts[i]}</span>}
          <div className="relative w-full flex-1">
            <div className="absolute inset-x-0 bottom-0 rounded-t bg-[#1f1f1f]" style={{ height: '100%' }} />
            <div className="absolute inset-x-0 bottom-0 rounded-t bg-[#c9a227] transition-all" style={{ height: `${(counts[i] / max) * 100}%` }} />
          </div>
          <span className="text-[10px] text-[#525252]">{day}</span>
        </div>
      ))}
    </div>
  )
}

function RoutinesBarChart({ routines, logs, periodStart, periodEnd }: {
  routines: Routine[]; logs: ReportData['routineLogsInPeriod']; periodStart: string; periodEnd: string
}) {
  const days: string[] = []
  let d = periodStart
  while (d <= periodEnd && days.length < 31) { days.push(d); d = addDaysISO(d, 1) }

  const bars = days.map((day) => {
    const scheduled = routines.filter((r) => isRoutineForDay(r, day)).length
    const done = logs.filter((l) => l.reference_date === day).length
    return { day: day.split('-')[2], scheduled, done }
  })
  const maxBar = Math.max(...bars.map((b) => b.scheduled), 1)
  const showLabel = days.length <= 14

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1" style={{ height: '80px' }}>
        {bars.map((bar) => (
          <PremiumTooltip key={bar.day} title={`Dia ${bar.day}`} content={`${bar.done} de ${bar.scheduled} rotinas`} side="top">
            <div className="relative flex flex-1 flex-col items-center">
              <div className="relative w-full flex-1">
                <div className="absolute inset-x-0 bottom-0 rounded-t bg-[#1f1f1f]" style={{ height: `${(bar.scheduled / maxBar) * 100}%` }} />
                {bar.done > 0 && (
                  <div className="absolute inset-x-0 bottom-0 rounded-t bg-[#c9a227] transition-all" style={{ height: `${(Math.min(bar.done, bar.scheduled) / maxBar) * 100}%` }} />
                )}
              </div>
              {showLabel && <span className="mt-0.5 text-[9px] text-[#525252]">{bar.day}</span>}
            </div>
          </PremiumTooltip>
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs text-[#737373]">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-[#c9a227]" />Realizadas</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-[#1f1f1f]" />Programadas</span>
      </div>
    </div>
  )
}

function TaskRow({ task }: { task: Task }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#1f1f1f] bg-[#111] px-3 py-2">
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#22c55e]" />
      <span className="min-w-0 flex-1 truncate text-sm text-[#d4d4d4]">{task.title}</span>
      <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
    </div>
  )
}

function OverdueRow({ task }: { task: Task }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#ef4444]/15 bg-[#ef4444]/5 px-3 py-2">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#ef4444]" />
      <span className="min-w-0 flex-1 truncate text-sm text-[#d4d4d4]">{task.title}</span>
      <span className="shrink-0 text-xs text-[#ef4444]">{task.due_date}</span>
    </div>
  )
}

function PendingRow({ task }: { task: Task }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-3 py-2">
      <Clock className="h-3.5 w-3.5 shrink-0 text-[#737373]" />
      <span className="min-w-0 flex-1 truncate text-sm text-[#d4d4d4]">{task.title}</span>
      {task.due_date && <span className="shrink-0 text-xs text-[#525252]">{task.due_date}</span>}
    </div>
  )
}

function MeetingRow({ meeting, showMinutesStatus }: { meeting: Meeting; showMinutesStatus?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#1f1f1f] bg-[#111] px-3 py-2">
      <Users className="h-3.5 w-3.5 shrink-0 text-[#737373]" />
      <span className="min-w-0 flex-1 truncate text-sm text-[#d4d4d4]">{meeting.title}</span>
      {showMinutesStatus && (
        <Badge variant={meeting.minutes ? 'success' : 'warning'}>{meeting.minutes ? 'com ata' : 'sem ata'}</Badge>
      )}
      <span className="shrink-0 text-xs text-[#525252]">
        {new Date(meeting.scheduled_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
      </span>
    </div>
  )
}

function DecisionRow({ decision }: { decision: ProjectDecision }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#c9a227]/15 bg-[#c9a227]/5 px-3 py-2">
      <Lightbulb className="h-3.5 w-3.5 shrink-0 text-[#c9a227]" />
      <span className="min-w-0 flex-1 truncate text-sm text-[#d4d4d4]">{decision.title}</span>
      <span className="shrink-0 text-xs text-[#525252]">
        {new Date(decision.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
      </span>
    </div>
  )
}

function NoteRow({ note }: { note: Note }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#1f1f1f] bg-[#111] px-3 py-2">
      <FileText className="h-3.5 w-3.5 shrink-0 text-[#737373]" />
      <span className="min-w-0 flex-1 truncate text-sm text-[#d4d4d4]">{note.title}</span>
      <span className="shrink-0 text-xs text-[#525252]">
        {new Date(note.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
      </span>
    </div>
  )
}

function EventRow({ event }: { event: CalendarEvent }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#1f1f1f] bg-[#111] px-3 py-2">
      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#737373]" />
      <span className="min-w-0 flex-1 truncate text-sm text-[#d4d4d4]">{event.title}</span>
      <span className="shrink-0 text-xs text-[#525252]">{formatTime(event.start_at)}</span>
    </div>
  )
}

function ProjectRow({ project, stale }: { project: Project; stale?: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${stale ? 'border-[#737373]/20 bg-[#737373]/5' : 'border-[#1f1f1f] bg-[#111]'}`}>
      <BarChart3 className={`h-3.5 w-3.5 shrink-0 ${stale ? 'text-[#737373]' : 'text-[#22c55e]'}`} />
      <span className="min-w-0 flex-1 truncate text-sm text-[#d4d4d4]">{project.name}</span>
      <span className="shrink-0 text-xs font-medium text-[#a3a3a3]">{project.progress}%</span>
    </div>
  )
}

function SectionCard({ title, icon, count, children, empty }: {
  title: string; icon: React.ReactNode; count: number; children: React.ReactNode; empty: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle>{title}</CardTitle>
          <Badge variant="muted">{count}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {count === 0 ? empty : <div className="flex flex-col gap-2">{children}</div>}
      </CardContent>
    </Card>
  )
}

// ─── SavedReviewsPanel ──────────────────────────────────────────────────────────

function SavedReviewsPanel({ reviews }: { reviews: ReportReview[] }) {
  const router = useRouter()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleDelete(id: string) {
    setBusy(true)
    await deleteReportReview(id)
    setBusy(false)
    setConfirmId(null)
    router.refresh()
  }

  if (reviews.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Archive className="h-4 w-4 text-[#737373]" />
          <CardTitle>Histórico de revisões salvas</CardTitle>
          <Badge variant="muted">{reviews.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-2">
          {reviews.map((rev) => (
            <div key={rev.id} className="rounded-xl border border-[#1f1f1f] bg-[#0d0d0d]">
              <div
                className="flex cursor-pointer items-center gap-3 p-3"
                onClick={() => setExpanded(expanded === rev.id ? null : rev.id)}
              >
                <Badge variant={rev.type === 'weekly' ? 'accent' : rev.type === 'monthly' ? 'success' : 'muted'}>
                  {reviewTypeLabel(rev.type)}
                </Badge>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#f5f5f5]">{rev.title}</span>
                <span className="shrink-0 text-xs text-[#525252]">
                  {new Date(rev.created_at).toLocaleDateString('pt-BR', { dateStyle: 'short' })}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[#ef4444] hover:bg-[#ef4444]/10 shrink-0"
                  onClick={(e) => { e.stopPropagation(); setConfirmId(rev.id) }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {expanded === rev.id && (
                <div className="border-t border-[#1a1a1a] px-3 pb-3 pt-2 space-y-3">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-center">
                    {[
                      { label: 'Concluídas', value: rev.completed_tasks, color: 'text-[#22c55e]' },
                      { label: 'Vencidas', value: rev.overdue_tasks, color: 'text-[#ef4444]' },
                      { label: 'Reuniões', value: rev.meetings_count, color: 'text-[#737373]' },
                      { label: 'Rotinas', value: rev.completed_routines, color: 'text-[#c9a227]' },
                    ].map((m) => (
                      <div key={m.label} className="rounded-lg border border-[#1f1f1f] bg-[#111] p-2">
                        <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                        <p className="text-xs text-[#737373]">{m.label}</p>
                      </div>
                    ))}
                  </div>
                  {rev.summary && (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#525252]">Resumo</p>
                      <p className="text-xs text-[#a3a3a3] whitespace-pre-line">{rev.summary}</p>
                    </div>
                  )}
                  {rev.wins && (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#525252]">Conquistas</p>
                      <p className="text-xs text-[#a3a3a3] whitespace-pre-line">{rev.wins}</p>
                    </div>
                  )}
                  {rev.next_focus && (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#525252]">Próximos focos</p>
                      <p className="text-xs text-[#a3a3a3] whitespace-pre-line">{rev.next_focus}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>

      <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Excluir revisão" size="sm">
        <p className="text-sm text-[#a3a3a3]">Esta revisão será excluída permanentemente.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmId(null)} disabled={busy}>Cancelar</Button>
          <Button variant="danger" onClick={() => confirmId && handleDelete(confirmId)} disabled={busy}>
            {busy ? 'Excluindo…' : 'Excluir'}
          </Button>
        </div>
      </Modal>
    </Card>
  )
}

// ─── WeeklyReviewForm ───────────────────────────────────────────────────────────

function WeeklyReviewForm({ data, periodStart, periodEnd, periodType }: {
  data: ReportData; periodStart: string; periodEnd: string; periodType: PeriodType
}) {
  const router = useRouter()
  const label = periodLabel(periodStart, periodEnd, periodType)
  const [form, setForm] = useState({
    summary: data.weeklyReview?.summary ?? '',
    wins: data.weeklyReview?.wins ?? '',
    pending_items: data.weeklyReview?.pending_items ?? '',
    next_focus: data.weeklyReview?.next_focus ?? '',
  })
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [savePending, startSave] = useTransition()
  const [reportPending, startReport] = useTransition()

  function generate() {
    const gen = buildAutoReview(data, periodStart, periodEnd)
    setForm(gen)
    setSaveSuccess(false)
    setSaveError(null)
  }

  function saveWeekly() {
    setSaveError(null)
    setSaveSuccess(false)
    startSave(async () => {
      const res = await saveWeeklyReview(periodStart, periodEnd, form)
      if (res.error) setSaveError(res.error)
      else { setSaveSuccess(true); router.refresh() }
    })
  }

  function saveAsReport() {
    setSaveError(null)
    startReport(async () => {
      const res = await saveReportReview({
        type: periodType,
        period_start: periodStart,
        period_end: periodEnd,
        title: `Revisão ${reviewTypeLabel(periodType)} — ${label}`,
        summary: form.summary || null,
        completed_tasks: data.completedTasks.length,
        pending_tasks: data.pendingTasks.length,
        overdue_tasks: data.overdueTasks.length,
        completed_routines: data.routineLogsInPeriod.length,
        total_routines: data.routinesActive.length,
        meetings_count: data.meetingsDone.length,
        notes_count: data.notesCreated.length,
        documents_count: data.documentsInPeriod.length,
        active_projects: data.progressedProjects.length,
        stalled_projects: data.staleProjects.length,
        wins: form.wins || null,
        pending_items: form.pending_items || null,
        next_focus: form.next_focus || null,
      })
      if (res.error) setSaveError(res.error)
      else { setSaveSuccess(true); router.refresh() }
    })
  }

  return (
    <Card elevated className="print:border-black">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#c9a227]" />
              Revisão {reviewTypeLabel(periodType).toLowerCase()}
              {data.weeklyReview && <Badge variant="success">Salva</Badge>}
            </CardTitle>
            <CardDescription className="mt-1">Resumo executivo · {label}</CardDescription>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button variant="secondary" onClick={generate}><Sparkles className="h-4 w-4" /> Gerar</Button>
            {periodType === 'weekly' && (
              <Button variant="secondary" loading={savePending} onClick={saveWeekly}>
                <Save className="h-4 w-4" /> Semanal
              </Button>
            )}
            <Button variant="accent" loading={reportPending} onClick={saveAsReport}>
              <Save className="h-4 w-4" /> Salvar revisão
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {saveError && (
          <div className="flex items-center justify-between rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/5 px-4 py-3 text-sm text-[#ef4444]">
            <span>{saveError}</span>
            <button onClick={() => setSaveError(null)} className="ml-3 opacity-60 hover:opacity-100">✕</button>
          </div>
        )}
        {saveSuccess && (
          <div className="rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/5 px-4 py-3 text-sm text-[#22c55e]">
            Revisão salva com sucesso.
          </div>
        )}
        <div className="grid gap-4 lg:grid-cols-2">
          <Textarea label="Resumo executivo" rows={5} value={form.summary}
            onChange={(e) => { setForm((f) => ({ ...f, summary: e.target.value })); setSaveSuccess(false) }}
            placeholder="O que aconteceu nesse período? Quais foram os principais avanços?" />
          <Textarea label="Conquistas" rows={5} value={form.wins}
            onChange={(e) => { setForm((f) => ({ ...f, wins: e.target.value })); setSaveSuccess(false) }}
            placeholder="• Tarefa X concluída&#10;• Projeto Y desbloqueado" />
          <Textarea label="Pendências e riscos" rows={5} value={form.pending_items}
            onChange={(e) => { setForm((f) => ({ ...f, pending_items: e.target.value })); setSaveSuccess(false) }}
            placeholder="• [ATRASADA] Tarefa Y&#10;• [ATA PENDENTE] Reunião Z" />
          <Textarea label="Próximos focos" rows={5} value={form.next_focus}
            onChange={(e) => { setForm((f) => ({ ...f, next_focus: e.target.value })); setSaveSuccess(false) }}
            placeholder="• Concluir tarefa X&#10;• Destravar projeto Y" />
        </div>
        <div className="flex justify-end gap-2 print:hidden">
          <Button variant="secondary" onClick={generate}><Sparkles className="h-4 w-4" /> Gerar revisão automática</Button>
          <Button variant="accent" loading={reportPending} onClick={saveAsReport}>
            <Save className="h-4 w-4" /> Salvar revisão
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── FocusSuggestions ──────────────────────────────────────────────────────────

function FocusSuggestions({ data }: { data: ReportData }) {
  const none = data.overdueTasks.length === 0 && data.staleProjects.length === 0 && data.meetingsNoMinutes.length === 0
  return (
    <Card elevated>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-4 w-4 text-[#c9a227]" />
          Próximos focos sugeridos
        </CardTitle>
        <CardDescription>Baseado em atrasos, projetos parados e atas pendentes</CardDescription>
      </CardHeader>
      <CardContent>
        {none ? (
          <EmptyState icon={<Sparkles className="h-5 w-5" />} title="Tudo em dia" description="Sem pendências críticas identificadas." className="py-6" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.overdueTasks.slice(0, 3).map((t) => (
              <div key={t.id} className="rounded-xl border border-[#ef4444]/15 bg-[#ef4444]/5 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#ef4444]">Tarefa atrasada</p>
                <p className="mt-1 text-sm font-medium text-[#f5f5f5]">{t.title}</p>
                <p className="mt-1 text-xs text-[#737373]">Venceu em {t.due_date}</p>
              </div>
            ))}
            {data.staleProjects.slice(0, 2).map((p) => (
              <div key={p.id} className="rounded-xl border border-[#525252]/20 bg-[#525252]/5 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#737373]">Projeto parado</p>
                <p className="mt-1 text-sm font-medium text-[#f5f5f5]">{p.name}</p>
                <p className="mt-1 text-xs text-[#737373]">{p.progress}% de progresso</p>
              </div>
            ))}
            {data.meetingsNoMinutes.slice(0, 2).map((m) => (
              <div key={m.id} className="rounded-xl border border-[#eab308]/15 bg-[#eab308]/5 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#eab308]">Ata pendente</p>
                <p className="mt-1 text-sm font-medium text-[#f5f5f5]">{m.title}</p>
                <p className="mt-1 text-xs text-[#737373]">{new Date(m.scheduled_at).toLocaleDateString('pt-BR')}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── DailyView ──────────────────────────────────────────────────────────────────

function DailyView({ data, periodStart }: { data: ReportData; periodStart: string }) {
  const routinesForDay = data.routinesActive.filter((r) => isRoutineForDay(r, periodStart))
  const logsForDay = data.routineLogsInPeriod.filter((l) => l.reference_date === periodStart)
  const logSet = new Set(logsForDay.map((l) => l.routine_id))

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard icon={<CheckCircle2 className="h-4 w-4" />} label="Tarefas concluídas" value={data.completedTasks.length} accent />
        <MetricCard icon={<Clock className="h-4 w-4" />} label="Tarefas pendentes" value={data.pendingTasks.length} />
        <MetricCard icon={<RotateCcw className="h-4 w-4" />} label="Rotinas do dia" value={`${logsForDay.length}/${routinesForDay.length}`}
          tooltip="Rotinas realizadas / programadas para hoje" />
        <MetricCard icon={<CalendarDays className="h-4 w-4" />} label="Compromissos" value={data.eventsInPeriod.length} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="flex flex-col gap-5">
          <SectionCard title="Tarefas do dia" icon={<CheckCircle2 className="h-4 w-4 text-[#22c55e]" />}
            count={data.completedTasks.length + data.pendingTasks.length}
            empty={<EmptyState title="Nenhuma tarefa para hoje" className="py-6" />}>
            <>
              {data.completedTasks.map((t) => <TaskRow key={t.id} task={t} />)}
              {data.pendingTasks.map((t) => <PendingRow key={t.id} task={t} />)}
            </>
          </SectionCard>

          {data.overdueTasks.length > 0 && (
            <SectionCard title="Pendências críticas" icon={<AlertTriangle className="h-4 w-4 text-[#ef4444]" />}
              count={data.overdueTasks.length}
              empty={<EmptyState title="Sem tarefas em atraso" className="py-4" />}>
              {data.overdueTasks.map((t) => <OverdueRow key={t.id} task={t} />)}
            </SectionCard>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <SectionCard title="Compromissos de hoje" icon={<CalendarDays className="h-4 w-4 text-[#737373]" />}
            count={data.eventsInPeriod.length}
            empty={<EmptyState title="Nenhum compromisso hoje" className="py-6" />}>
            {data.eventsInPeriod.map((e) => <EventRow key={e.id} event={e} />)}
          </SectionCard>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-[#c9a227]" />
                <CardTitle>Rotinas de hoje</CardTitle>
                <Badge variant="muted">{logsForDay.length}/{routinesForDay.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {routinesForDay.length === 0
                ? <EmptyState title="Nenhuma rotina programada para hoje" className="py-4" />
                : (
                  <div className="flex flex-col gap-2">
                    {routinesForDay.map((r) => (
                      <div key={r.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${logSet.has(r.id) ? 'border-[#22c55e]/20 bg-[#22c55e]/5' : 'border-[#1f1f1f] bg-[#111]'}`}>
                        <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${logSet.has(r.id) ? 'text-[#22c55e]' : 'text-[#525252]'}`} />
                        <span className="min-w-0 flex-1 truncate text-sm text-[#d4d4d4]">{r.title}</span>
                        {r.target_time && <span className="shrink-0 text-xs text-[#525252]">{r.target_time}</span>}
                      </div>
                    ))}
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ─── FullView (weekly / monthly / custom) ──────────────────────────────────────

function FullView({ data, periodStart, periodEnd, periodType }: {
  data: ReportData; periodStart: string; periodEnd: string; periodType: PeriodType
}) {
  const total = data.completedTasks.length + data.overdueTasks.length
  const rate = total > 0 ? Math.round((data.completedTasks.length / total) * 100) : 0
  const focusMin = focusMinutes(data.focusSessions)
  const routineRate = data.routinesActive.length > 0
    ? Math.round((data.routineLogsInPeriod.length / Math.max(data.routinesActive.length, 1)) * 100)
    : 0

  return (
    <div className="flex flex-col gap-5">
      {/* Metrics strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <MetricCard icon={<CheckCircle2 className="h-4 w-4" />} label="Tarefas concluídas" value={data.completedTasks.length} sub="no período" accent />
        <MetricCard icon={<Target className="h-4 w-4" />} label="Taxa de conclusão" value={`${rate}%`} sub={`${total} no total`}
          tooltip="Tarefas concluídas ÷ (concluídas + vencidas)" />
        <MetricCard icon={<Users className="h-4 w-4" />} label="Reuniões realizadas" value={data.meetingsDone.length} sub={`${data.meetingsNoMinutes.length} sem ata`}
          tooltip="Reuniões com status 'realizada' no período" />
        <MetricCard icon={<RotateCcw className="h-4 w-4" />} label="Rotinas cumpridas" value={data.routineLogsInPeriod.length}
          sub={`de ${data.routinesActive.length} ativas`} tooltip="Logs de rotinas registrados no período" />
        <MetricCard icon={<FileText className="h-4 w-4" />} label="Notas criadas" value={data.notesCreated.length} />
        <MetricCard icon={<Zap className="h-4 w-4" />} label="Tempo de foco" value={focusLabel(focusMin)} sub={`${data.focusSessions.length} sessões`} />
      </div>

      {/* Main grid */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          {/* Bar chart */}
          <Card elevated>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#c9a227]" />
                Tarefas concluídas por dia
              </CardTitle>
              <CardDescription>{periodLabel(periodStart, periodEnd, periodType)}</CardDescription>
            </CardHeader>
            <CardContent>
              {data.completedTasks.length === 0
                ? <EmptyState title="Nenhuma tarefa concluída" description="Conclua tarefas para ver a distribuição." className="py-8" />
                : (
                  <>
                    <WeeklyBarChart tasks={data.completedTasks} />
                    <div className="mt-3 flex items-center gap-4 text-xs text-[#737373]">
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-[#c9a227]" />Concluídas</span>
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-[#1f1f1f]" />Dias da semana</span>
                    </div>
                  </>
                )}
            </CardContent>
          </Card>

          {/* Routines chart */}
          {data.routinesActive.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-[#c9a227]" />
                  Cumprimento de rotinas
                  <PremiumTooltip title="Taxa de rotinas" content="Barras douradas = realizadas, cinza = programadas" side="top">
                    <Badge variant="accent">{routineRate}%</Badge>
                  </PremiumTooltip>
                </CardTitle>
                <CardDescription>{data.routineLogsInPeriod.length} realizações · {data.routinesActive.length} rotinas ativas</CardDescription>
              </CardHeader>
              <CardContent>
                <RoutinesBarChart routines={data.routinesActive} logs={data.routineLogsInPeriod} periodStart={periodStart} periodEnd={periodEnd} />
              </CardContent>
            </Card>
          )}

          <SectionCard title="Tarefas concluídas" icon={<CheckCircle2 className="h-4 w-4 text-[#22c55e]" />}
            count={data.completedTasks.length}
            empty={<EmptyState title="Nenhuma tarefa concluída no período" className="py-6" />}>
            {data.completedTasks.map((t) => <TaskRow key={t.id} task={t} />)}
          </SectionCard>

          <SectionCard title="Tarefas vencidas" icon={<AlertTriangle className="h-4 w-4 text-[#ef4444]" />}
            count={data.overdueTasks.length}
            empty={<EmptyState title="Sem tarefas em atraso" description="Bom trabalho!" className="py-6" />}>
            {data.overdueTasks.map((t) => <OverdueRow key={t.id} task={t} />)}
          </SectionCard>

          {/* Projects */}
          {(data.progressedProjects.length > 0 || data.staleProjects.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#737373]" />
                  Projetos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.progressedProjects.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#525252]">Com avanço no período</p>
                    <div className="flex flex-col gap-2">{data.progressedProjects.map((p) => <ProjectRow key={p.id} project={p} />)}</div>
                  </div>
                )}
                {data.staleProjects.length > 0 && (
                  <div>
                    <PremiumTooltip title="Projetos parados" content="Projetos sem atualização há mais de 14 dias" side="top">
                      <p className="mb-2 cursor-default text-xs font-medium uppercase tracking-wide text-[#525252]">Parados (&gt;14 dias)</p>
                    </PremiumTooltip>
                    <div className="flex flex-col gap-2">{data.staleProjects.map((p) => <ProjectRow key={p.id} project={p} stale />)}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {data.documentsInPeriod.length > 0 && (
            <SectionCard title="Documentos enviados" icon={<Archive className="h-4 w-4 text-[#737373]" />}
              count={data.documentsInPeriod.length}
              empty={<EmptyState title="Nenhum documento no período" className="py-4" />}>
              {data.documentsInPeriod.map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-lg border border-[#1f1f1f] bg-[#111] px-3 py-2">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-[#737373]" />
                  <span className="min-w-0 flex-1 truncate text-sm text-[#d4d4d4]">{d.title}</span>
                  <span className="shrink-0 text-xs text-[#525252]">
                    {d.file_size ? `${(d.file_size / 1024).toFixed(0)} KB` : ''}
                  </span>
                </div>
              ))}
            </SectionCard>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <SectionCard title="Reuniões realizadas" icon={<Users className="h-4 w-4 text-[#737373]" />}
            count={data.meetingsDone.length}
            empty={<EmptyState title="Nenhuma reunião no período" className="py-6" />}>
            {data.meetingsDone.map((m) => <MeetingRow key={m.id} meeting={m} showMinutesStatus />)}
          </SectionCard>

          {data.meetingsNoMinutes.length > 0 && (
            <Card className="border-[#eab308]/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#eab308]">
                  <AlertTriangle className="h-4 w-4" />
                  Reuniões sem ata
                  <Badge variant="warning">{data.meetingsNoMinutes.length}</Badge>
                </CardTitle>
                <CardDescription>Reuniões realizadas sem ata registrada</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col gap-2">
                  {data.meetingsNoMinutes.map((m) => <MeetingRow key={m.id} meeting={m} />)}
                </div>
              </CardContent>
            </Card>
          )}

          <SectionCard title="Decisões registradas" icon={<Lightbulb className="h-4 w-4 text-[#c9a227]" />}
            count={data.decisions.length}
            empty={<EmptyState title="Nenhuma decisão registrada no período" className="py-6" />}>
            {data.decisions.map((d) => <DecisionRow key={d.id} decision={d} />)}
          </SectionCard>

          <SectionCard title="Notas criadas" icon={<BookOpen className="h-4 w-4 text-[#737373]" />}
            count={data.notesCreated.length}
            empty={<EmptyState title="Nenhuma nota criada no período" className="py-6" />}>
            {data.notesCreated.map((n) => <NoteRow key={n.id} note={n} />)}
          </SectionCard>

          <SectionCard title="Compromissos realizados" icon={<CalendarDays className="h-4 w-4 text-[#737373]" />}
            count={data.eventsInPeriod.length}
            empty={<EmptyState title="Nenhum compromisso no período" className="py-6" />}>
            {data.eventsInPeriod.map((e) => <EventRow key={e.id} event={e} />)}
          </SectionCard>
        </div>
      </div>

      <FocusSuggestions data={data} />
      <WeeklyReviewForm data={data} periodStart={periodStart} periodEnd={periodEnd} periodType={periodType} />
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────────

export function ReportsClient({ data, periodStart, periodEnd, periodType, projectId }: ReportsClientProps) {
  const router = useRouter()

  // Custom period picker state
  const [customStart, setCustomStart] = useState(periodStart)
  const [customEnd, setCustomEnd] = useState(periodEnd)

  const label = periodLabel(periodStart, periodEnd, periodType)

  function navigate(dir: 'prev' | 'next') {
    let newStart = periodStart
    let newEnd = periodEnd

    if (periodType === 'daily') {
      newStart = newEnd = addDaysISO(periodStart, dir === 'prev' ? -1 : 1)
    } else if (periodType === 'weekly') {
      const offset = dir === 'prev' ? -7 : 7
      newStart = addDaysISO(periodStart, offset)
      newEnd = addDaysISO(periodEnd, offset)
    } else if (periodType === 'monthly') {
      newStart = addMonthsISO(periodStart, dir === 'prev' ? -1 : 1)
      newEnd = monthEndISO(newStart)
    } else {
      return // custom: no auto-nav
    }

    push({ period: periodType, periodStart: newStart, periodEnd: newEnd, projectId })
  }

  function changeTab(tab: PeriodType) {
    push({ period: tab, periodStart: undefined, periodEnd: undefined, projectId })
  }

  function changeProject(pid: string) {
    push({ period: periodType, periodStart, periodEnd, projectId: pid || null })
  }

  function applyCustom() {
    if (!customStart || !customEnd || customStart > customEnd) return
    push({ period: 'custom', periodStart: customStart, periodEnd: customEnd, projectId })
  }

  function push({ period, periodStart: ps, periodEnd: pe, projectId: pid }: {
    period: PeriodType; periodStart?: string; periodEnd?: string; projectId: string | null
  }) {
    const params = new URLSearchParams()
    params.set('period', period)
    if (ps) params.set('periodStart', ps)
    if (pe) params.set('periodEnd', pe)
    if (pid) params.set('projectId', pid)
    router.push(`/reports?${params.toString()}`)
  }

  if (data.error) {
    return (
      <div className="mx-auto max-w-[1500px]">
        <PageHeader title="Relatórios" description="Visão executiva de produtividade e progresso" />
        <ErrorState title="Erro ao carregar relatório" message={data.error} onRetry={() => router.refresh()} />
      </div>
    )
  }

  const TABS: { key: PeriodType; label: string }[] = [
    { key: 'daily', label: 'Diário' },
    { key: 'weekly', label: 'Semanal' },
    { key: 'monthly', label: 'Mensal' },
    { key: 'custom', label: 'Personalizado' },
  ]

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 print:space-y-4">
      {/* Header */}
      <PageHeader
        title="Relatórios"
        description="Visão executiva de produtividade e progresso"
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <PremiumTooltip title="Exportar CSV" content="Gera um arquivo CSV com os principais dados do período atual." side="bottom">
              <Button variant="secondary" size="sm" onClick={() => exportReportCSV(data, periodStart, periodEnd)}>
                <Download className="h-4 w-4" />
                CSV
              </Button>
            </PremiumTooltip>
            <PremiumTooltip title="Exportar PDF" content="Abre o diálogo de impressão do navegador. Selecione 'Salvar como PDF'." side="bottom">
              <Button variant="secondary" size="sm" onClick={() => window.print()}>
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </PremiumTooltip>
          </div>
        }
      />

      {/* Period tabs */}
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <div className="flex rounded-xl border border-[#262626] bg-[#0d0d0d] p-1 gap-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => changeTab(tab.key)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                periodType === tab.key
                  ? 'bg-[#c9a227]/10 text-[#c9a227] border border-[#c9a227]/20'
                  : 'text-[#737373] hover:text-[#a3a3a3]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Navigation (not for custom) */}
        {periodType !== 'custom' && (
          <div className="flex items-center gap-1 rounded-xl border border-[#262626] bg-[#111] p-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => navigate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm font-medium text-[#f5f5f5] capitalize">{label}</span>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => navigate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Custom date picker */}
        {periodType === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="h-8 rounded-lg border border-[#262626] bg-[#111] px-2 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227]"
            />
            <span className="text-sm text-[#737373]">até</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="h-8 rounded-lg border border-[#262626] bg-[#111] px-2 text-sm text-[#f5f5f5] outline-none focus:border-[#c9a227]"
            />
            <Button size="sm" variant="accent" onClick={applyCustom} disabled={!customStart || !customEnd || customStart > customEnd}>
              Aplicar
            </Button>
          </div>
        )}

        {/* Project filter */}
        <Select
          aria-label="Filtrar por projeto"
          value={projectId ?? ''}
          className="w-48"
          options={[
            { value: '', label: 'Todos os projetos' },
            ...data.allProjects.map((p) => ({ value: p.id, label: p.name })),
          ]}
          onChange={(e) => changeProject(e.target.value)}
        />

        {projectId && (
          <Badge variant="accent">{data.allProjects.find((p) => p.id === projectId)?.name ?? 'Projeto'}</Badge>
        )}
      </div>

      {/* Print header */}
      <div className="hidden print:block">
        <h1 className="text-xl font-bold text-black">Relatório {reviewTypeLabel(periodType)} — {label}</h1>
        {projectId && <p className="text-sm text-gray-600">Projeto: {data.allProjects.find((p) => p.id === projectId)?.name}</p>}
      </div>

      {/* View content */}
      {periodType === 'daily'
        ? <DailyView data={data} periodStart={periodStart} />
        : <FullView data={data} periodStart={periodStart} periodEnd={periodEnd} periodType={periodType} />}

      {/* Saved reviews history */}
      <SavedReviewsPanel reviews={data.savedReviews} />
    </div>
  )
}
