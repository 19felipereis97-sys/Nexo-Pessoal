'use server'

import { createClient } from '@/lib/supabase/server'
import type { Document, Project, Task, Meeting, Note } from '@/lib/supabase/types'

export interface DocumentWithRefs extends Document {
  project_name?: string | null
  task_title?: string | null
  meeting_title?: string | null
  note_title?: string | null
}

export interface DocumentsData {
  documents: DocumentWithRefs[]
  projects: Array<Pick<Project, 'id' | 'name'>>
  tasks: Array<Pick<Task, 'id' | 'title'>>
  meetings: Array<Pick<Meeting, 'id' | 'title'>>
  notes: Array<Pick<Note, 'id' | 'title'>>
  totalSize: number
  error: string | null
}

export async function getDocumentsData(): Promise<DocumentsData> {
  const empty: DocumentsData = { documents: [], projects: [], tasks: [], meetings: [], notes: [], totalSize: 0, error: null }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ...empty, error: 'Não autenticado' }

    const [docsRes, projectsRes, tasksRes, meetingsRes, notesRes] = await Promise.all([
      supabase.from('documents').select('*').eq('user_id', user.id).order('uploaded_at', { ascending: false }),
      supabase.from('projects').select('id, name').eq('user_id', user.id).neq('status', 'arquivado').order('name').limit(100),
      supabase.from('tasks').select('id, title').eq('user_id', user.id).neq('status', 'cancelado').order('title').limit(200),
      supabase.from('meetings').select('id, title').eq('user_id', user.id).order('title').limit(100),
      supabase.from('notes').select('id, title').eq('user_id', user.id).eq('archived', false).order('title').limit(100),
    ])

    if (docsRes.error) return { ...empty, error: docsRes.error.message }

    const rawDocs = (docsRes.data ?? []) as Document[]
    const projects = (projectsRes.data ?? []) as Array<Pick<Project, 'id' | 'name'>>
    const tasks = (tasksRes.data ?? []) as Array<Pick<Task, 'id' | 'title'>>
    const meetings = (meetingsRes.data ?? []) as Array<Pick<Meeting, 'id' | 'title'>>
    const notes = (notesRes.data ?? []) as Array<Pick<Note, 'id' | 'title'>>

    const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]))
    const taskMap = Object.fromEntries(tasks.map((t) => [t.id, t.title]))
    const meetingMap = Object.fromEntries(meetings.map((m) => [m.id, m.title]))
    const noteMap = Object.fromEntries(notes.map((n) => [n.id, n.title]))

    const documents: DocumentWithRefs[] = rawDocs.map((d) => ({
      ...d,
      project_name: d.project_id ? (projectMap[d.project_id] ?? null) : null,
      task_title: d.task_id ? (taskMap[d.task_id] ?? null) : null,
      meeting_title: d.meeting_id ? (meetingMap[d.meeting_id] ?? null) : null,
      note_title: d.note_id ? (noteMap[d.note_id] ?? null) : null,
    }))

    const totalSize = rawDocs.reduce((sum, d) => sum + (d.file_size ?? 0), 0)

    return { documents, projects, tasks, meetings, notes, totalSize, error: null }
  } catch {
    return { ...empty, error: 'Não foi possível carregar os documentos.' }
  }
}
