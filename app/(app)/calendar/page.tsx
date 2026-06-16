import { PageHeader } from '@/components/shared/page-header'
import { CalendarClient } from '@/components/calendar/calendar-client'
import { getCalendarPageData } from '@/lib/data/calendar'

export const metadata = { title: 'Agenda – Nexo Pessoal' }

interface CalendarPageProps {
  searchParams?: Promise<{ highlight?: string }>
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const [{ events, projects, error }, params] = await Promise.all([
    getCalendarPageData(),
    searchParams ?? Promise.resolve({} as { highlight?: string }),
  ])

  if (error) {
    return (
      <div className="mx-auto max-w-[1500px]">
        <PageHeader title="Agenda" description="Visualize e gerencie seus compromissos" />
        <div className="rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/5 px-4 py-3 text-sm text-[#ef4444]">
          Erro ao carregar agenda: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 mx-auto max-w-[1500px]">
      <PageHeader title="Agenda" description="Visualize e gerencie seus compromissos" />
      <div className="flex-1 min-h-0">
        <CalendarClient initialEvents={events} projects={projects} highlightId={params.highlight} />
      </div>
    </div>
  )
}
