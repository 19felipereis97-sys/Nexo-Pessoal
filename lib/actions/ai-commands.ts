'use server'

import { revalidatePath } from 'next/cache'
import { createCalendarEvent } from '@/lib/actions/events'
import { createNote } from '@/lib/actions/notes'
import { createTask } from '@/lib/actions/tasks'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/types'
import { interpretInternalCommand } from '@/lib/services/internal-command-engine'
import type { AICommandPlan, AICommandRecord } from '@/lib/types/ai-command'

function revalidateAssistant() {
  revalidatePath('/assistant')
  revalidatePath('/dashboard')
  revalidatePath('/today')
}

export async function previewInternalCommand(rawText: string): Promise<{
  plan: AICommandPlan | null
  commandId: string | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { plan: null, commandId: null, error: 'Não autenticado' }

  const plan = interpretInternalCommand(rawText)
  const { data, error } = await supabase
    .from('ai_commands')
    .insert({
      user_id: user.id,
      source: 'assistant',
      raw_text: rawText.trim(),
      intent: plan.intent,
      status: 'draft',
      payload: plan.payload as Json,
    })
    .select('id')
    .single()

  if (error) return { plan: null, commandId: null, error: error.message }
  return { plan, commandId: data.id, error: null }
}

export async function executeInternalCommand(commandId: string): Promise<{
  record: AICommandRecord | null
  href: string | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { record: null, href: null, error: 'Não autenticado' }

  const { data: command, error: loadError } = await supabase
    .from('ai_commands')
    .select('*')
    .eq('id', commandId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (loadError || !command) return { record: null, href: null, error: loadError?.message ?? 'Comando não encontrado' }
  if (command.status !== 'draft') return { record: command as AICommandRecord, href: null, error: 'Este comando já foi processado.' }

  const plan = interpretInternalCommand(command.raw_text)
  if (!plan.canExecute) {
    await supabase.from('ai_commands').update({ status: 'failed', error: plan.warnings.join(' ') || 'Comando incompleto' }).eq('id', commandId).eq('user_id', user.id)
    return { record: null, href: null, error: plan.warnings.join(' ') || 'Comando incompleto' }
  }

  let resultEntityType: string | null = null
  let resultEntityId: string | null = null
  let href: string | null = null
  let error: string | null = null

  if (plan.intent === 'create_task') {
    const result = await createTask(plan.payload as unknown as Parameters<typeof createTask>[0])
    error = result.error
    resultEntityType = result.task ? 'task' : null
    resultEntityId = result.task?.id ?? null
    href = result.task ? `/tasks?highlight=${result.task.id}` : null
  } else if (plan.intent === 'create_note') {
    const result = await createNote(plan.payload as unknown as Parameters<typeof createNote>[0])
    error = result.error
    resultEntityType = result.note ? 'note' : null
    resultEntityId = result.note?.id ?? null
    href = result.note ? `/notes?highlight=${result.note.id}` : null
  } else if (plan.intent === 'create_event') {
    const result = await createCalendarEvent(plan.payload as unknown as Parameters<typeof createCalendarEvent>[0])
    error = result.error
    resultEntityType = result.event ? 'event' : null
    resultEntityId = result.event?.id ?? null
    href = result.event ? `/calendar?highlight=${result.event.id}` : null
  } else {
    error = 'Intenção ainda não suportada para execução.'
  }

  const patch = error
    ? { status: 'failed', error }
    : {
        status: 'executed',
        result_entity_type: resultEntityType,
        result_entity_id: resultEntityId,
        executed_at: new Date().toISOString(),
        error: null,
      }

  const { data: updated } = await supabase
    .from('ai_commands')
    .update(patch)
    .eq('id', commandId)
    .eq('user_id', user.id)
    .select('*')
    .single()

  revalidateAssistant()
  return { record: (updated as AICommandRecord | null) ?? null, href, error }
}
