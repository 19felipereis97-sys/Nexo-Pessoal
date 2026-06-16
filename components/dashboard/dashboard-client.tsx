'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ListTodo,
  Video,
  TrendingUp,
  StickyNote,
  Target,
  AlertTriangle,
  Sparkles,
  Plus,
  CalendarClock,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PremiumTooltip } from '@/components/ui/premium-tooltip'
import { DashboardMetricCard } from './dashboard-metric-card'
import { TodayTasksPanel } from './today-tasks-panel'
import { TodayAgendaPanel } from './today-agenda-panel'
import { CriticalPendingPanel } from './critical-pending-panel'
import { ActiveProjectsPanel } from './active-projects-panel'
import { MeetingsSummaryPanel } from './meetings-summary-panel'
import { RecentNotesPanel } from './recent-notes-panel'
import { MiniCalendarPanel } from './mini-calendar-panel'
import { UpcomingCommitmentsPanel } from './upcoming-commitments-panel'
import { NexoAICard } from './nexo-ai-card'
import { TaskDrawer } from './task-drawer'
import { EventDrawer } from './event-drawer'
import { DashboardDrawer, type DrawerItem } from './dashboard-drawer'
import { PlanDayModal } from './plan-day-modal'
import { AddTaskModal } from './add-task-modal'
import { AddEventModal } from './add-event-modal'
import { AddNoteModal } from './add-note-modal'
import { AddProjectModal } from './add-project-modal'
import { AddMeetingModal } from './add-meeting-modal'
import { toggleTaskComplete } from '@/lib/actions/tasks'
import { greetingByHour, fullWeekday, formatTime } from '@/lib/utils/date'
import type { DashboardData } from '@/lib/data/dashboard'
import type { Task, CalendarEvent } from '@/lib/supabase/types'

type ModalType = 'plan' | 'task' | 'event' | 'note' | 'project' | 'meeting' | null

interface DashboardClientProps {
  data: DashboardData
}

export function DashboardClient({ data }: DashboardClientProps) {
  const router = useRouter()
  const {
    todayTasks,
    overdueTasks,
    todayEvents,
    upcomingEvents,
    activeProjects,
    staleProjects,
    todayMeetings,
    upcomingMeetings,
    meetingsWithoutMinutes,
    recentNotes,
    profile,
  } = data

  // Drawers
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [drawerItem, setDrawerItem] = useState<DrawerItem | null>(null)

  // Modals
  const [modal, setModal] = useState<ModalType>(null)

  // Optimistic task completion
  const [optimisticDone, setOptimisticDone] = useState<Set<string>>(new Set())
  const [pendingToggle, setPendingToggle] = useState<Set<string>>(new Set())

  // Session-local note pinning (persistence requires a DB column — see notes)
  const [pinnedNotes, setPinnedNotes] = useState<Set<string>>(new Set())

  const isTaskDone = (t: Task) => optimisticDone.has(t.id) || t.status === 'concluida'

  const handleToggleTask = async (task: Task) => {
    const next = !isTaskDone(task)
    setPendingToggle((s) => new Set(s).add(task.id))
    setOptimisticDone((s) => {
      const n = new Set(s)
      if (next) n.add(task.id)
      else n.delete(task.id)
      return n
    })
    const result = await toggleTaskComplete(task.id, next)
    setPendingToggle((s) => {
      const n = new Set(s)
      n.delete(task.id)
      return n
    })
    if (result.error) {
      // revert on failure
      setOptimisticDone((s) => {
        const n = new Set(s)
        if (next) n.delete(task.id)
        else n.add(task.id)
        return n
      })
    } else {
      router.refresh()
    }
  }

  const togglePin = (id: string) =>
    setPinnedNotes((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const refresh = () => router.refresh()
  const closeModal = () => setModal(null)

  // ── Derived metrics ──────────────────────────────────────────
  const firstName = profile?.full_name?.split(' ')[0] ?? 'você'
  const doneToday = todayTasks.filter(isTaskDone).length
  const pendingToday = todayTasks.length - doneToday
  const urgentCount = todayTasks.filter((t) => ['urgente', 'critica'].includes(t.priority) && !isTaskDone(t)).length
  const completionRate = todayTasks.length > 0 ? Math.round((doneToday / todayTasks.length) * 100) : 0
  const avgProjectProgress =
    activeProjects.length > 0
      ? Math.round(activeProjects.reduce((acc, p) => acc + (p.progress ?? 0), 0) / activeProjects.length)
      : 0
  const nextMeeting = todayMeetings[0]
  const meetingsDone = todayMeetings.filter((m) => m.status === 'realizada').length

  const foco = useMemo(() => {
    if (urgentCount > 0) return { value: 'Priorize o urgente', sub: `${urgentCount} tarefa${urgentCount > 1 ? 's' : ''} urgente${urgentCount > 1 ? 's' : ''} hoje` }
    if (pendingToday > 0) return { value: 'Execução', sub: `${pendingToday} tarefa${pendingToday > 1 ? 's' : ''} para concluir` }
    if (todayMeetings.length > 0) return { value: 'Alinhamentos', sub: `${todayMeetings.length} reunião${todayMeetings.length > 1 ? 'ões' : ''} no dia` }
    if (todayTasks.length > 0) return { value: 'Dia concluído', sub: 'Tudo planejado foi feito' }
    return { value: 'Planejamento', sub: 'Organize as prioridades do dia' }
  }, [urgentCount, pendingToday, todayMeetings.length, todayTasks.length])

  const activityDays = useMemo(() => {
    const set = new Set<string>()
    const add = (iso: string) => set.add(iso.split('T')[0])
    todayEvents.forEach((e) => add(e.start_at))
    upcomingEvents.forEach((e) => add(e.start_at))
    todayMeetings.forEach((m) => add(m.scheduled_at))
    upcomingMeetings.forEach((m) => add(m.scheduled_at))
    return set
  }, [todayEvents, upcomingEvents, todayMeetings, upcomingMeetings])

  const hasCritical = urgentCount > 0 || overdueTasks.length > 0 || meetingsWithoutMinutes.length > 0 || staleProjects.length > 0

  return (
    <div className="nexo-dashboard-shell relative flex flex-col gap-4 rounded-[24px] p-4 md:p-5">
      {/* Greeting */}
      <header className="nexo-dashboard-intro flex flex-col gap-1 rounded-xl px-4 py-3">
        <h1 className="text-2xl font-bold tracking-tight text-[#f5f5f5]">
          {greetingByHour()}, {firstName}.
        </h1>
        <p className="text-sm text-[#a3a3a3]">Aqui está o panorama executivo do seu dia.</p>
        <p className="mt-0.5 text-xs capitalize text-[#737373]">{fullWeekday()}</p>
      </header>

      {/* Error */}
      {data.error && (
        <div className="flex items-center gap-3 rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-[#ef4444]" />
          <p className="text-sm text-[#ef4444]">{data.error}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <PremiumTooltip content="Veja um resumo ordenado de tarefas e compromissos de hoje" side="bottom">
          <Button variant="accent" onClick={() => setModal('plan')} className="w-full sm:w-auto">
            <Sparkles className="h-4 w-4" />
            Planejar meu dia
          </Button>
        </PremiumTooltip>
        <Button variant="secondary" onClick={() => setModal('task')} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Adicionar tarefa
        </Button>
        <Button variant="secondary" onClick={() => setModal('event')} className="w-full sm:w-auto">
          <CalendarClock className="h-4 w-4" />
          Adicionar compromisso
        </Button>
        <Button variant="secondary" onClick={() => setModal('note')} className="w-full sm:w-auto">
          <FileText className="h-4 w-4" />
          Nota rápida
        </Button>
      </div>

      {/* Executive metric strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <DashboardMetricCard
          icon={ListTodo}
          label="Tarefas do dia"
          value={todayTasks.length}
          subtext={todayTasks.length === 0 ? 'Sem tarefas cadastradas' : `${pendingToday} pendente${pendingToday !== 1 ? 's' : ''} · ${doneToday} concluída${doneToday !== 1 ? 's' : ''}`}
          progress={todayTasks.length === 0 ? null : completionRate}
          tooltip="Tarefas com vencimento para hoje e seu percentual de conclusão."
          empty={todayTasks.length === 0}
        />
        <DashboardMetricCard
          icon={Video}
          label="Reuniões hoje"
          value={todayMeetings.length}
          subtext={todayMeetings.length === 0 ? 'Nenhuma reunião hoje' : nextMeeting ? `Próxima às ${formatTime(nextMeeting.scheduled_at)}` : `${meetingsDone} realizada(s)`}
          progress={todayMeetings.length === 0 ? null : Math.round((meetingsDone / todayMeetings.length) * 100)}
          tooltip="Reuniões agendadas para hoje e quantas já foram realizadas."
          empty={todayMeetings.length === 0}
        />
        <DashboardMetricCard
          icon={TrendingUp}
          label="Projetos ativos"
          value={activeProjects.length}
          subtext={activeProjects.length === 0 ? 'Nenhum projeto ativo' : `Progresso médio ${avgProjectProgress}%`}
          progress={activeProjects.length === 0 ? null : avgProjectProgress}
          tooltip="Projetos em andamento e seu progresso médio."
          empty={activeProjects.length === 0}
        />
        <DashboardMetricCard
          icon={StickyNote}
          label="Notas recentes"
          value={recentNotes.length}
          subtext={recentNotes.length === 0 ? 'Nenhuma nota ainda' : `Última: ${new Date(recentNotes[0].updated_at).toLocaleDateString('pt-BR')}`}
          tooltip="Notas e registros atualizados recentemente."
          empty={recentNotes.length === 0}
          onClick={() => router.push('/notes')}
        />
        <DashboardMetricCard
          icon={Target}
          label="Foco do dia"
          value={<span className="text-base leading-tight">{foco.value}</span>}
          subtext={foco.sub}
          tooltip="Sugestão de foco calculada a partir das prioridades e da agenda de hoje."
          empty={todayTasks.length === 0 && todayMeetings.length === 0}
        />
      </div>

      {/* Critical attention banner */}
      {hasCritical && (
        <div className="nexo-surface-accent rounded-xl px-4 py-3.5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#c9a227]">
            O que exige sua atenção agora
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#d4d4d4]">
            {urgentCount > 0 && (
              <span><span className="font-semibold text-[#ef4444]">{urgentCount}</span> tarefa{urgentCount > 1 ? 's' : ''} urgente{urgentCount > 1 ? 's' : ''} hoje</span>
            )}
            {overdueTasks.length > 0 && (
              <span><span className="font-semibold text-[#ef4444]">{overdueTasks.length}</span> em atraso</span>
            )}
            {meetingsWithoutMinutes.length > 0 && (
              <span><span className="font-semibold text-[#eab308]">{meetingsWithoutMinutes.length}</span> reunião(ões) sem ata</span>
            )}
            {staleProjects.length > 0 && (
              <span><span className="font-semibold text-[#a3a3a3]">{staleProjects.length}</span> projeto(s) parado(s)</span>
            )}
          </div>
        </div>
      )}

      {/* Main layout: content + right rail */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2.15fr)_minmax(280px,0.85fr)]">
        {/* Content */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TodayTasksPanel
              tasks={todayTasks}
              isDone={isTaskDone}
              pendingIds={pendingToggle}
              onToggle={handleToggleTask}
              onSelect={setSelectedTask}
              onCreate={() => setModal('task')}
            />
            <TodayAgendaPanel
              events={todayEvents}
              onSelect={setSelectedEvent}
              onCreate={() => setModal('event')}
            />
            <CriticalPendingPanel
              overdueTasks={overdueTasks}
              meetingsWithoutMinutes={meetingsWithoutMinutes}
              staleProjects={staleProjects}
              onSelectTask={setSelectedTask}
              onSelectMeeting={(m) => setDrawerItem({ kind: 'meeting', data: m })}
              onSelectProject={(p) => setDrawerItem({ kind: 'project', data: p })}
            />
            <ActiveProjectsPanel
              projects={activeProjects}
              onSelect={(p) => setDrawerItem({ kind: 'project', data: p })}
              onCreate={() => setModal('project')}
            />
          </div>

          {/* Lower summary row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <MeetingsSummaryPanel
              meetings={upcomingMeetings.length > 0 ? upcomingMeetings : todayMeetings}
              onSelect={(m) => setDrawerItem({ kind: 'meeting', data: m })}
              onCreate={() => setModal('meeting')}
            />
            <RecentNotesPanel
              notes={recentNotes}
              pinnedIds={pinnedNotes}
              onTogglePin={togglePin}
              onSelect={(n) => setDrawerItem({ kind: 'note', data: n })}
              onCreate={() => setModal('note')}
            />
          </div>
        </div>

        {/* Right rail */}
        <aside className="flex flex-col gap-4">
          <MiniCalendarPanel activityDays={activityDays} />
          <UpcomingCommitmentsPanel
            events={upcomingEvents}
            onSelect={setSelectedEvent}
            onCreate={() => setModal('event')}
          />
          <NexoAICard />
        </aside>
      </div>

      {/* Drawers */}
      <TaskDrawer key={selectedTask?.id ?? 'none'} task={selectedTask} onClose={() => setSelectedTask(null)} onRefresh={refresh} />
      <EventDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      <DashboardDrawer item={drawerItem} onClose={() => setDrawerItem(null)} />

      {/* Modals */}
      <PlanDayModal
        open={modal === 'plan'}
        onClose={closeModal}
        tasks={todayTasks.filter((t) => !isTaskDone(t))}
        events={todayEvents}
      />
      <AddTaskModal open={modal === 'task'} onClose={closeModal} onSuccess={refresh} />
      <AddEventModal open={modal === 'event'} onClose={closeModal} onSuccess={refresh} />
      <AddNoteModal open={modal === 'note'} onClose={closeModal} onSuccess={refresh} />
      <AddProjectModal open={modal === 'project'} onClose={closeModal} onSuccess={refresh} />
      <AddMeetingModal open={modal === 'meeting'} onClose={closeModal} onSuccess={refresh} />
    </div>
  )
}
