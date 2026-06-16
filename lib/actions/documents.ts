'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from '@/lib/utils/documents'
import type { AllowedExtension } from '@/lib/utils/documents'

export interface SaveDocumentInput {
  id: string
  title: string
  description?: string
  file_name: string
  file_path: string
  file_type?: string
  file_size?: number
  category?: string
  tags?: string[]
  project_id?: string | null
  task_id?: string | null
  meeting_id?: string | null
  note_id?: string | null
}

export interface UpdateDocumentInput {
  title?: string
  description?: string
  category?: string
  tags?: string[]
  project_id?: string | null
  task_id?: string | null
  meeting_id?: string | null
  note_id?: string | null
}

function revalidate() {
  revalidatePath('/documents')
  revalidatePath('/dashboard')
}

export async function saveDocument(input: SaveDocumentInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado', document: null }

  if (!input.title.trim()) return { error: 'Título é obrigatório', document: null }

  // Server-side file validation (defense-in-depth — client also validates)
  const ext = input.file_name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_EXTENSIONS.includes(ext as AllowedExtension)) {
    return { error: `Extensão .${ext} não permitida.`, document: null }
  }
  if (input.file_size && input.file_size > MAX_FILE_SIZE) {
    return { error: 'Arquivo muito grande. Máximo 50 MB.', document: null }
  }

  const { data, error } = await supabase
    .from('documents')
    .insert({
      id: input.id,
      user_id: user.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      file_name: input.file_name,
      file_path: input.file_path,
      file_type: input.file_type || null,
      file_size: input.file_size || null,
      category: input.category || null,
      tags: input.tags?.length ? input.tags : null,
      project_id: input.project_id || null,
      task_id: input.task_id || null,
      meeting_id: input.meeting_id || null,
      note_id: input.note_id || null,
    })
    .select()
    .single()

  if (error) return { error: error.message, document: null }
  revalidate()
  return { error: null, document: data }
}

export async function updateDocument(id: string, input: UpdateDocumentInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.title !== undefined) update.title = input.title.trim()
  if (input.description !== undefined) update.description = input.description?.trim() || null
  if (input.category !== undefined) update.category = input.category || null
  if (input.tags !== undefined) update.tags = input.tags?.length ? input.tags : null
  if ('project_id' in input) update.project_id = input.project_id || null
  if ('task_id' in input) update.task_id = input.task_id || null
  if ('meeting_id' in input) update.meeting_id = input.meeting_id || null
  if ('note_id' in input) update.note_id = input.note_id || null

  const { error } = await supabase.from('documents').update(update as {
    updated_at: string
    title?: string
    description?: string | null
    category?: string | null
    tags?: string[] | null
    project_id?: string | null
    task_id?: string | null
    meeting_id?: string | null
    note_id?: string | null
  }).eq('id', id).eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidate()
  return { error: null }
}

export async function archiveDocument(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('documents')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidate()
  return { error: null }
}

export async function restoreDocument(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('documents')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidate()
  return { error: null }
}

export async function deleteDocument(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  // Get file_path first for Storage deletion
  const { data: doc } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (doc?.file_path) {
    // Delete from Storage — non-fatal if it fails (orphan cleanup handled separately)
    await supabase.storage.from('documents').remove([doc.file_path])
  }

  const { error } = await supabase.from('documents').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidate()
  return { error: null }
}

export async function getDocumentSignedUrl(id: string, expiresIn = 3600) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado', url: null }

  const { data: doc } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!doc?.file_path) return { error: 'Documento não encontrado', url: null }

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(doc.file_path, expiresIn)

  if (error || !data?.signedUrl) return { error: error?.message ?? 'Erro ao gerar URL', url: null }
  return { error: null, url: data.signedUrl }
}

export async function getDocumentDownloadUrl(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado', url: null }

  const { data: doc } = await supabase
    .from('documents')
    .select('file_path, file_name')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!doc?.file_path) return { error: 'Documento não encontrado', url: null }

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(doc.file_path, 60, { download: doc.file_name })

  if (error || !data?.signedUrl) return { error: error?.message ?? 'Erro ao gerar URL', url: null }
  return { error: null, url: data.signedUrl }
}
