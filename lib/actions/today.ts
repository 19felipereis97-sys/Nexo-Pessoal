'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { todayISO } from '@/lib/utils/date'

function refresh() { revalidatePath('/today'); revalidatePath('/dashboard'); revalidatePath('/tasks') }

export async function reorderTodayTasks(taskIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  const results = await Promise.all(taskIds.map((id, index) => supabase.from('tasks').update({ execution_order: index }).eq('id', id).eq('user_id', user.id)))
  const error = results.find((result) => result.error)?.error
  if (error) return { error: error.message }
  refresh(); return { error: null }
}

export async function planToday(taskIds: string[]) { return reorderTodayTasks(taskIds) }

export async function rescheduleTask(taskId: string, dueDate: string, dueTime?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  const { error } = await supabase.from('tasks').update({ due_date: dueDate, due_time: dueTime || null, execution_order: null }).eq('id', taskId).eq('user_id', user.id)
  if (error) return { error: error.message }
  refresh(); return { error: null }
}

export async function createDailyNote(content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado', note: null }
  if (!content.trim()) return { error: 'Escreva uma nota', note: null }
  const { data, error } = await supabase.from('daily_notes').insert({ user_id: user.id, content: content.trim() }).select().single()
  if (error) return { error: error.message, note: null }
  refresh(); return { error: null, note: data }
}

export async function convertDailyNoteToTask(noteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado', task: null }
  const { data: note } = await supabase.from('daily_notes').select('*').eq('id', noteId).eq('user_id', user.id).maybeSingle()
  if (!note) return { error: 'Nota não encontrada', task: null }
  if (note.converted_task_id) return { error: 'Nota já transformada em tarefa', task: null }
  const { data: task, error } = await supabase.from('tasks').insert({ user_id: user.id, title: note.content, due_date: note.note_date, status: 'a-fazer', priority: 'média' }).select().single()
  if (error || !task) return { error: error?.message ?? 'Erro ao criar tarefa', task: null }
  await supabase.from('daily_notes').update({ converted_task_id: task.id }).eq('id', noteId).eq('user_id', user.id)
  refresh(); return { error: null, task }
}

export async function saveDailyReview(summary: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  if (!summary.trim()) return { error: 'Escreva um resumo do dia' }
  const today = todayISO()
  const { error } = await supabase.from('daily_reviews').upsert({ user_id: user.id, review_date: today, summary: summary.trim() }, { onConflict: 'user_id,review_date' })
  if (error) return { error: error.message }
  refresh(); return { error: null }
}

export async function startFocus(taskId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado', session: null }
  await supabase.from('focus_sessions').update({ ended_at: new Date().toISOString() }).eq('user_id', user.id).is('ended_at', null)
  const { data, error } = await supabase.from('focus_sessions').insert({ user_id: user.id, task_id: taskId || null }).select().single()
  if (error) return { error: error.message, session: null }
  refresh(); return { error: null, session: data }
}

export async function stopFocus(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  const { error } = await supabase.from('focus_sessions').update({ ended_at: new Date().toISOString() }).eq('id', sessionId).eq('user_id', user.id)
  if (error) return { error: error.message }
  refresh(); return { error: null }
}
