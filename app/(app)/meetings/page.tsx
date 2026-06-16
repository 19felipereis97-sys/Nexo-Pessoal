import { PageHeader } from '@/components/shared/page-header'
import { ErrorState } from '@/components/ui/error-state'
import { MeetingsClient } from '@/components/meetings/meetings-client'
import { getMeetingsPageData } from '@/lib/data/meetings'

export const metadata = { title: 'Reuniões – Nexo Pessoal' }

export default async function MeetingsPage() {
  const { meetings, projects, error } = await getMeetingsPageData()
  return <div className="mx-auto flex max-w-[1500px] flex-col gap-4"><PageHeader title="Reuniões" description="Prepare pautas, registre decisões e transforme alinhamentos em execução" />{error ? <ErrorState title="Erro ao carregar reuniões" message={error} /> : <MeetingsClient initialMeetings={meetings} projects={projects} />}</div>
}
