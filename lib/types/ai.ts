export interface AIInteraction {
  id: string
  user_id: string
  mode: string
  question: string
  answer: string
  context: unknown
  feedback: 'helpful' | 'not_helpful' | null
  created_at: string
}

export type AIMode =
  | 'chat'
  | 'resumo-dia'
  | 'planejamento'
  | 'revisao-semanal'
  | 'priorizar'
  | 'projetos-parados'
  | 'gerar-ata'
