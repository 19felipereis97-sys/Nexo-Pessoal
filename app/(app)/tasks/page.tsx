import { PageHeader } from '@/components/shared/page-header'
import { TasksClient } from '@/components/tasks/tasks-client'
import { getTasksPageData } from '@/lib/data/tasks'

export const metadata = { title: 'Tarefas – Nexo Pessoal' }

export default async function TasksPage() {
  const { tasks, projects, error } = await getTasksPageData()

  if (error) {
    return (
      <div className="mx-auto max-w-[1500px]">
        <PageHeader title="Tarefas" description="Gerencie e priorize suas tarefas" />
        <div className="flex items-center gap-2 rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/5 px-4 py-3 text-sm text-[#ef4444]">
          Erro ao carregar tarefas: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-full max-w-[1500px] flex-col gap-4">
      <PageHeader
        title="Tarefas"
        description="Gerencie e priorize suas tarefas"
      />
      <TasksClient initialTasks={tasks} projects={projects} />
    </div>
  )
}
