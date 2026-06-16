'use client'

import { useState, useCallback, useOptimistic } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-state'
import { RoutineFormModal } from '@/components/routines/routine-form-modal'
import { RoutineDrawer } from '@/components/routines/routine-drawer'
import { logRoutineComplete, unlogRoutineComplete } from '@/lib/actions/routines'
import { isRoutineForDay, calcStreak, isOverdue, AREA_LABELS, FREQUENCY_LABELS } from '@/lib/utils/routines'
import { addDaysISO } from '@/lib/utils/date'
import type { RoutinesData } from '@/lib/data/routines'
import type { Routine, RoutineLog } from '@/lib/supabase/types'
import { Plus, Check, ChevronLeft, ChevronRight, Flame, Calendar, List, Archive } from 'lucide-react'

type View = 'hoje' | 'semana' | 'todas' | 'arquivadas'

// Optimistic log toggle type
type OptimisticAction =
  | { type: 'add'; routineId: string; date: string }
  | { type: 'remove'; routineId: string; date: string }

function applyOptimistic(logs: RoutineLog[], action: OptimisticAction): RoutineLog[] {
  if (action.type === 'add') {
    const already = logs.some((l) => l.routine_id === action.routineId && l.reference_date === action.date)
    if (already) return logs
    return [
      ...logs,
      {
        id: `optimistic-${action.routineId}-${action.date}`,
        routine_id: action.routineId,
        user_id: '',
        completed_at: new Date().toISOString(),
        reference_date: action.date,
        notes: null,
        created_at: new Date().toISOString(),
      },
    ]
  }
  return logs.filter((l) => !(l.routine_id === action.routineId && l.reference_date === action.date))
}

interface RoutineCardProps {
  routine: Routine
  date: string
  logs: RoutineLog[]
  onToggle: (routineId: string, date: string, done: boolean) => void
  onClick: () => void
  showStreak?: boolean
  toggling?: string | null
}

function RoutineCard({ routine, date, logs, onToggle, onClick, showStreak = true, toggling }: RoutineCardProps) {
  const done = logs.some((l) => l.routine_id === routine.id && l.reference_date === date)
  const streak = showStreak ? calcStreak(routine, logs, date) : 0
  const overdue = isOverdue(routine, logs, date)
  const isToggling = toggling === `${routine.id}-${date}`

  return (
    <Card
      className={`cursor-pointer transition-all hover:border-[#333] ${done ? 'border-green-900/30' : overdue ? 'border-red-900/20' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-sm font-medium truncate ${done ? 'text-[#737373] line-through' : 'text-[#e5e5e5]'}`}>
                {routine.title}
              </p>
              {routine.area && (
                <Badge variant="muted" className="text-xs shrink-0">{AREA_LABELS[routine.area] ?? routine.area}</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-[#525252]">{FREQUENCY_LABELS[routine.frequency] ?? routine.frequency}</span>
              {routine.target_time && (
                <span className="text-xs text-[#525252]">{routine.target_time.slice(0, 5)}</span>
              )}
              {showStreak && streak > 0 && (
                <span className="flex items-center gap-1 text-xs text-[#c9a227]">
                  <Flame className="h-3 w-3" />
                  {streak}
                </span>
              )}
              {overdue && !done && (
                <Badge variant="danger" className="text-xs">atrasada</Badge>
              )}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(routine.id, date, done) }}
            disabled={isToggling}
            className={`shrink-0 flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              done
                ? 'bg-green-950/40 text-green-400 hover:bg-red-950/30 hover:text-red-400'
                : 'bg-[#1e1e1e] text-[#737373] hover:bg-[#2a2a2a] hover:text-[#e5e5e5]'
            }`}
          >
            {isToggling ? <LoadingSpinner /> : done ? <><Check className="h-3 w-3" /> Feita</> : 'Marcar'}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

// Week view — 7 columns Mon-Sun
interface WeekViewProps {
  routines: Routine[]
  logs: RoutineLog[]
  weekStart: string
  today: string
  onToggle: (routineId: string, date: string, done: boolean) => void
  onOpenRoutine: (routine: Routine) => void
  toggling: string | null
}

const DOW_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function WeekView({ routines, logs, weekStart, today, onToggle, onOpenRoutine, toggling }: WeekViewProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i))
  const activeRoutines = routines.filter((r) => r.status === 'active')

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr>
            <th className="text-left text-xs text-[#525252] font-medium py-2 pr-3 w-48">Rotina</th>
            {days.map((d, i) => (
              <th key={d} className={`text-center text-xs font-medium py-2 px-1 w-12 ${d === today ? 'text-[#c9a227]' : 'text-[#525252]'}`}>
                <div>{DOW_PT[i]}</div>
                <div className="text-[10px] font-normal">{d.slice(8)}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1a1a1a]">
          {activeRoutines.map((routine) => (
            <tr key={routine.id} className="group hover:bg-[#141414]">
              <td className="py-2 pr-3">
                <button onClick={() => onOpenRoutine(routine)} className="text-left">
                  <p className="text-sm text-[#e5e5e5] hover:text-[#c9a227] transition-colors">{routine.title}</p>
                </button>
              </td>
              {days.map((d) => {
                const scheduled = isRoutineForDay(routine, d)
                const done = logs.some((l) => l.routine_id === routine.id && l.reference_date === d)
                const isToggling = toggling === `${routine.id}-${d}`
                const future = d > today

                if (!scheduled) return <td key={d} className="py-2 px-1 text-center"><span className="text-[#2a2a2a] text-xs">—</span></td>

                return (
                  <td key={d} className="py-2 px-1 text-center">
                    <button
                      onClick={() => !future && onToggle(routine.id, d, done)}
                      disabled={isToggling || future}
                      className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto transition-colors ${
                        future
                          ? 'bg-[#1a1a1a] text-[#2a2a2a] cursor-default'
                          : done
                          ? 'bg-green-900/50 text-green-400 hover:bg-red-950/40 hover:text-red-400'
                          : 'bg-[#1e1e1e] text-[#525252] hover:bg-[#2a2a2a] hover:text-[#e5e5e5]'
                      }`}
                    >
                      {isToggling ? <LoadingSpinner /> : done ? <Check className="h-3 w-3" /> : <span className="text-[10px]">○</span>}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
          {activeRoutines.length === 0 && (
            <tr>
              <td colSpan={8} className="py-8 text-center text-sm text-[#525252]">Nenhuma rotina ativa</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// Area filter
interface Props {
  data: RoutinesData
}

export function RoutinesClient({ data }: Props) {
  const router = useRouter()
  const [view, setView] = useState<View>('hoje')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null)
  const [areaFilter, setAreaFilter] = useState('todas')
  const [freqFilter, setFreqFilter] = useState('todas')
  const [toggling, setToggling] = useState<string | null>(null)

  // Week navigation (local state – no SSR re-fetch for week view)
  const { today } = data
  const [weekOffset, setWeekOffset] = useState(0)
  const weekStart = (() => {
    const d = new Date(`${today}T12:00:00Z`)
    const dow = d.getUTCDay()
    const diffToMonday = dow === 0 ? -6 : 1 - dow
    const monday = new Date(d.getTime() + (diffToMonday + weekOffset * 7) * 86400000)
    return monday.toISOString().slice(0, 10)
  })()

  const [optimisticLogs, dispatchOptimistic] = useOptimistic<RoutineLog[], OptimisticAction>(
    data.logs,
    (state, action) => applyOptimistic(state, action)
  )

  const activeRoutines = data.routines.filter((r) => r.status === 'active')
  const archivedRoutines = data.routines.filter((r) => r.status === 'archived')

  const todayRoutines = activeRoutines.filter((r) => isRoutineForDay(r, today))
  const todayDone = optimisticLogs.filter((l) => todayRoutines.some((r) => r.id === l.routine_id) && l.reference_date === today).length
  const todayTotal = todayRoutines.length
  const todayPct = todayTotal ? Math.round((todayDone / todayTotal) * 100) : 0

  const bestStreak = activeRoutines.reduce((max, r) => {
    const s = calcStreak(r, optimisticLogs, today)
    return s > max ? s : max
  }, 0)

  const overdueCount = activeRoutines.filter((r) => isOverdue(r, optimisticLogs, today)).length

  const handleToggle = useCallback(async (routineId: string, date: string, done: boolean) => {
    const key = `${routineId}-${date}`
    setToggling(key)
    dispatchOptimistic({ type: done ? 'remove' : 'add', routineId, date })
    const result = done
      ? await unlogRoutineComplete(routineId, date)
      : await logRoutineComplete(routineId, date)
    setToggling(null)
    if (!result.error) router.refresh()
  }, [dispatchOptimistic, router])

  function openDrawer(routine: Routine) {
    setSelectedRoutine(routine)
    setDrawerOpen(true)
  }

  function openEdit(routine: Routine) {
    setEditingRoutine(routine)
    setDrawerOpen(false)
    setModalOpen(true)
  }

  function applyFilters(routines: Routine[]) {
    return routines.filter((r) => {
      if (areaFilter !== 'todas' && r.area !== areaFilter) return false
      if (freqFilter !== 'todas' && r.frequency !== freqFilter) return false
      return true
    })
  }

  const tabs: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'hoje', label: 'Hoje', icon: <Check className="h-3.5 w-3.5" /> },
    { id: 'semana', label: 'Semana', icon: <Calendar className="h-3.5 w-3.5" /> },
    { id: 'todas', label: 'Todas', icon: <List className="h-3.5 w-3.5" /> },
    { id: 'arquivadas', label: 'Arquivadas', icon: <Archive className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader
        title="Rotinas"
        description="Hábitos e processos recorrentes"
        actions={
          <Button variant="accent" size="sm" onClick={() => { setEditingRoutine(null); setModalOpen(true) }}>
            <Plus className="h-3.5 w-3.5" />
            Nova rotina
          </Button>
        }
      />

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border border-[#1e1e1e] bg-[#0f0f0f] p-4">
          <p className="text-2xl font-bold text-[#e5e5e5]">{todayDone}/{todayTotal}</p>
          <p className="text-xs text-[#737373] mt-0.5">Concluídas hoje</p>
          {todayTotal > 0 && (
            <div className="mt-2 h-1 rounded-full bg-[#1e1e1e] overflow-hidden">
              <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${todayPct}%` }} />
            </div>
          )}
        </div>
        <div className="rounded-lg border border-[#1e1e1e] bg-[#0f0f0f] p-4">
          <p className="text-2xl font-bold text-[#c9a227] flex items-center gap-1">
            <Flame className="h-5 w-5" />{bestStreak}
          </p>
          <p className="text-xs text-[#737373] mt-0.5">Maior sequência</p>
        </div>
        <div className="rounded-lg border border-[#1e1e1e] bg-[#0f0f0f] p-4">
          <p className="text-2xl font-bold text-[#e5e5e5]">{activeRoutines.length}</p>
          <p className="text-xs text-[#737373] mt-0.5">Rotinas ativas</p>
        </div>
        <div className="rounded-lg border border-[#1e1e1e] bg-[#0f0f0f] p-4">
          <p className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-400' : 'text-green-400'}`}>{overdueCount}</p>
          <p className="text-xs text-[#737373] mt-0.5">Em atraso</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#1e1e1e] mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors -mb-px border-b-2 ${
              view === tab.id
                ? 'border-[#c9a227] text-[#c9a227]'
                : 'border-transparent text-[#737373] hover:text-[#e5e5e5]'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'hoje' && todayTotal > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 ${todayDone === todayTotal ? 'bg-green-950/50 text-green-400' : 'bg-[#1e1e1e] text-[#737373]'}`}>
                {todayPct}%
              </span>
            )}
            {tab.id === 'arquivadas' && archivedRoutines.length > 0 && (
              <span className="text-xs bg-[#1e1e1e] text-[#737373] rounded-full px-1.5 py-0.5">{archivedRoutines.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Hoje */}
      {view === 'hoje' && (
        <div className="space-y-2">
          {todayRoutines.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[#525252] text-sm">Nenhuma rotina para hoje</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setEditingRoutine(null); setModalOpen(true) }}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Criar primeira rotina
              </Button>
            </div>
          ) : (
            <>
              {todayDone === todayTotal && todayTotal > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-green-950/20 border border-green-900/30 px-4 py-3 mb-4">
                  <Check className="h-4 w-4 text-green-400" />
                  <p className="text-sm text-green-400 font-medium">Todas as rotinas de hoje concluídas!</p>
                </div>
              )}
              {todayRoutines.map((r) => (
                <RoutineCard
                  key={r.id}
                  routine={r}
                  date={today}
                  logs={optimisticLogs}
                  onToggle={handleToggle}
                  onClick={() => openDrawer(r)}
                  toggling={toggling}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Semana */}
      {view === 'semana' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setWeekOffset((o) => o - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-[#a3a3a3]">
                {weekStart.slice(8)}/{weekStart.slice(5, 7)} – {addDaysISO(weekStart, 6).slice(8)}/{addDaysISO(weekStart, 6).slice(5, 7)}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setWeekOffset((o) => o + 1)} disabled={weekOffset >= 0}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            {weekOffset !== 0 && (
              <button onClick={() => setWeekOffset(0)} className="text-xs text-[#c9a227] hover:underline">
                Semana atual
              </button>
            )}
          </div>
          <WeekView
            routines={activeRoutines}
            logs={optimisticLogs}
            weekStart={weekStart}
            today={today}
            onToggle={handleToggle}
            onOpenRoutine={openDrawer}
            toggling={toggling}
          />
        </div>
      )}

      {/* Todas */}
      {view === 'todas' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="rounded border border-[#2a2a2a] bg-[#141414] px-2 py-1.5 text-xs text-[#a3a3a3] focus:outline-none"
            >
              <option value="todas">Todas as áreas</option>
              {Object.entries(AREA_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select
              value={freqFilter}
              onChange={(e) => setFreqFilter(e.target.value)}
              className="rounded border border-[#2a2a2a] bg-[#141414] px-2 py-1.5 text-xs text-[#a3a3a3] focus:outline-none"
            >
              <option value="todas">Todas as frequências</option>
              {Object.entries(FREQUENCY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            {applyFilters(activeRoutines).length === 0 ? (
              <p className="py-8 text-center text-sm text-[#525252]">Nenhuma rotina encontrada</p>
            ) : (
              applyFilters(activeRoutines).map((r) => (
                <RoutineCard
                  key={r.id}
                  routine={r}
                  date={today}
                  logs={optimisticLogs}
                  onToggle={handleToggle}
                  onClick={() => openDrawer(r)}
                  showStreak
                  toggling={toggling}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Arquivadas */}
      {view === 'arquivadas' && (
        <div className="space-y-2">
          {archivedRoutines.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#525252]">Nenhuma rotina arquivada</p>
          ) : (
            archivedRoutines.map((r) => (
              <Card key={r.id} className="cursor-pointer opacity-60 hover:opacity-80 transition-opacity" onClick={() => openDrawer(r)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#a3a3a3]">{r.title}</p>
                      <p className="text-xs text-[#525252]">{FREQUENCY_LABELS[r.frequency] ?? r.frequency}</p>
                    </div>
                    <Badge variant="muted">Arquivada</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      <RoutineFormModal
        key={`${editingRoutine?.id ?? 'new'}-${modalOpen ? 'open' : 'closed'}`}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingRoutine(null) }}
        routine={editingRoutine}
        projects={data.projects}
      />

      <RoutineDrawer
        key={selectedRoutine?.id ?? 'none'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        routine={selectedRoutine}
        checklistItems={data.checklistItems}
        logs={optimisticLogs}
        today={today}
        onEdit={openEdit}
      />
    </div>
  )
}
