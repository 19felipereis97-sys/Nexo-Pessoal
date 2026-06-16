'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface CreateProjectInput {
  name: string
  description?: string
  priority?: string
  status?: string
  start_date?: string
  due_date?: string
}

function revalidateProject(projectId?: string) {
  revalidatePath('/dashboard')
  revalidatePath('/projects')
  if (projectId) revalidatePath(`/projects/${projectId}`)
}

export async function createProject(input: CreateProjectInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado', project: null }
  if (!input.name.trim()) return { error: 'Nome é obrigatório', project: null }

  const { data, error } = await supabase.from('projects').insert({
    user_id: user.id,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    status: input.status ?? 'planejado',
    priority: input.priority ?? 'média',
    start_date: input.start_date || null,
    due_date: input.due_date || null,
    progress: 0,
  }).select().single()

  if (error) return { error: error.message, project: null }
  revalidateProject(data.id)
  return { error: null, project: data }
}

export async function updateProject(projectId: string, input: Partial<CreateProjectInput>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  if (input.name !== undefined && !input.name.trim()) return { error: 'Nome é obrigatório' }

  const update = {
    ...input,
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.description !== undefined ? { description: input.description.trim() || null } : {}),
  }
  const { error } = await supabase.from('projects').update(update).eq('id', projectId).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidateProject(projectId)
  return { error: null }
}

export async function setProjectArchived(projectId: string, archived: boolean) {
  return updateProject(projectId, { status: archived ? 'arquivado' : 'em-andamento' })
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  const { error } = await supabase.from('projects').delete().eq('id', projectId).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidateProject()
  return { error: null }
}
