'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface NoteInput {
  title: string
  content?: string
  type?: string
  project_id?: string
  task_id?: string
  meeting_id?: string
}

async function inferProjectId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  input: NoteInput,
) {
  if (input.project_id) return input.project_id
  if (input.task_id) {
    const { data } = await supabase.from('tasks').select('project_id').eq('id', input.task_id).eq('user_id', userId).maybeSingle()
    if (data?.project_id) return data.project_id
  }
  if (input.meeting_id) {
    const { data } = await supabase.from('meetings').select('project_id').eq('id', input.meeting_id).eq('user_id', userId).maybeSingle()
    if (data?.project_id) return data.project_id
  }
  return undefined
}

function revalidate(projectId?: string) {
  revalidatePath('/dashboard')
  revalidatePath('/notes')
  revalidatePath('/projects')
  revalidatePath('/tasks')
  revalidatePath('/meetings')
  if (projectId) revalidatePath(`/projects/${projectId}`)
}

export async function createNote(inputOrTitle: NoteInput | string, content = '', projectId?: string) {
  const input: NoteInput = typeof inputOrTitle === 'string'
    ? { title: inputOrTitle, content, project_id: projectId, type: 'nota_rapida' }
    : inputOrTitle
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado', note: null }
  if (!input.title.trim()) return { error: 'Título é obrigatório', note: null }
  const inferredProjectId = await inferProjectId(supabase, user.id, input)

  const { data, error } = await supabase.from('notes').insert({
    user_id: user.id,
    title: input.title.trim(),
    content: input.content?.trim() ?? '',
    type: input.type ?? 'nota_rapida',
    project_id: inferredProjectId || null,
    task_id: input.task_id || null,
    meeting_id: input.meeting_id || null,
  }).select().single()
  if (error) return { error: error.message, note: null }
  revalidate(data.project_id ?? undefined)
  return { error: null, note: data }
}

export async function updateNote(noteId: string, input: NoteInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  if (!input.title.trim()) return { error: 'Título é obrigatório' }
  const inferredProjectId = await inferProjectId(supabase, user.id, input)
  const { data, error } = await supabase.from('notes').update({
    title: input.title.trim(),
    content: input.content?.trim() ?? '',
    type: input.type ?? 'nota_rapida',
    project_id: inferredProjectId || null,
    task_id: input.task_id || null,
    meeting_id: input.meeting_id || null,
  }).eq('id', noteId).eq('user_id', user.id).select().single()
  if (error) return { error: error.message }
  revalidate(data.project_id ?? undefined)
  return { error: null }
}

export async function deleteNote(noteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  const { error } = await supabase.from('notes').delete().eq('id', noteId).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidate()
  return { error: null }
}

export async function setNotePinned(noteId: string, pinned: boolean) {
  return updateNoteFlag(noteId, { pinned })
}

export async function setNoteArchived(noteId: string, archived: boolean) {
  return updateNoteFlag(noteId, { archived, pinned: false })
}

async function updateNoteFlag(noteId: string, patch: { pinned?: boolean; archived?: boolean }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  const { data, error } = await supabase.from('notes').update(patch).eq('id', noteId).eq('user_id', user.id).select().single()
  if (error) return { error: error.message }
  revalidate(data.project_id ?? undefined)
  return { error: null }
}

export async function transformNoteToTask(noteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado', task: null }
  const { data: note } = await supabase.from('notes').select('*').eq('id', noteId).eq('user_id', user.id).maybeSingle()
  if (!note) return { error: 'Nota não encontrada', task: null }
  if (note.converted_task_id) return { error: 'Nota já transformada em tarefa', task: null }
  const { data: task, error } = await supabase.from('tasks').insert({
    user_id: user.id,
    project_id: note.project_id,
    title: note.title,
    description: note.content,
    status: 'a-fazer',
    priority: 'média',
  }).select().single()
  if (error || !task) return { error: error?.message ?? 'Erro ao criar tarefa', task: null }
  await supabase.from('notes').update({ converted_task_id: task.id, task_id: task.id }).eq('id', noteId).eq('user_id', user.id)
  revalidate(note.project_id ?? undefined)
  return { error: null, task }
}

export async function transformNoteToDecision(noteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado', decision: null }
  const { data: note } = await supabase.from('notes').select('*').eq('id', noteId).eq('user_id', user.id).maybeSingle()
  if (!note) return { error: 'Nota não encontrada', decision: null }
  if (!note.project_id) return { error: 'Vincule a nota a um projeto antes de transformar em decisão', decision: null }
  if (note.converted_decision_id) return { error: 'Nota já transformada em decisão', decision: null }
  const { data: decision, error } = await supabase.from('project_decisions').insert({
    user_id: user.id,
    project_id: note.project_id,
    meeting_id: note.meeting_id,
    title: note.title,
    description: note.content,
  }).select().single()
  if (error || !decision) return { error: error?.message ?? 'Erro ao criar decisão', decision: null }
  await supabase.from('notes').update({ converted_decision_id: decision.id, type: 'decisao' }).eq('id', noteId).eq('user_id', user.id)
  revalidate(note.project_id)
  return { error: null, decision }
}
