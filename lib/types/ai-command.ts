export type AICommandIntent = 'create_task' | 'create_event' | 'create_note' | 'unknown'
export type AICommandStatus = 'draft' | 'executed' | 'failed' | 'cancelled'

export interface CommandPreviewField {
  label: string
  value: string
}

export interface AICommandPlan {
  intent: AICommandIntent
  title: string
  summary: string
  confidence: number
  payload: Record<string, unknown>
  fields: CommandPreviewField[]
  warnings: string[]
  canExecute: boolean
}

export interface AICommandRecord {
  id: string
  user_id: string
  source: string
  raw_text: string
  intent: string
  status: AICommandStatus
  payload: unknown
  result_entity_type: string | null
  result_entity_id: string | null
  error: string | null
  executed_at: string | null
  created_at: string
}
