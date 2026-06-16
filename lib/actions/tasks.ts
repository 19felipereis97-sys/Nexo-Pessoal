'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

function revalidate() {
  revalidatePath('/dashboard')
  revalidatePath('/today')
  revalidatePath('/tasks')
  revalidatePath('/projects')
}

export async function toggleTaskComplete(taskId: string, completed: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('tasks')
    .update({
      status: completed ? 'concluida' : 'em-andamento',
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidate()
  return { error: null }
}

export async function updateTaskStatus(taskId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const update = {
    status,
    updated_at: new Date().toISOString(),
    completed_at: status === 'concluida' ? new Date().toISOString() : null,
  }

  const { error } = await supabase
    .from('tasks')
    .update(update)
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidate()
  return { error: null }
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidate()
  return { error: null }
}

export interface CreateTaskInput {
  title: string
  description?: string
  priority?: string
  status?: string
  due_date?: string
  due_time?: string
  project_id?: string
  meeting_id?: string
}

export async function createTask(input: CreateTaskInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado', task: null }

  if (!input.title.trim()) return { error: 'Título é obrigatório', task: null }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      priority: input.priority ?? 'média',
      status: input.status ?? 'backlog',
      due_date: input.due_date || null,
      due_time: input.due_time || null,
      project_id: input.project_id || null,
      meeting_id: input.meeting_id || null,
    })
    .select()
    .single()

  if (error) return { error: error.message, task: null }
  revalidate()
  if (data.project_id) revalidatePath(`/projects/${data.project_id}`)
  if (data.meeting_id) revalidatePath('/meetings')
  return { error: null, task: data }
}

export async function updateTask(taskId: string, input: Partial<CreateTaskInput>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('tasks')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidate()
  return { error: null }
}
