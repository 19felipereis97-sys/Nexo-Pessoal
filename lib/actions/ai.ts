'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { callGemini } from '@/lib/services/gemini'
import { buildAIContext, formatContextForPrompt } from '@/lib/services/ai-context'
import type { AIMode } from '@/lib/types/ai'

const SYSTEM_PROMPT = `Você é o assistente pessoal do Nexo Pessoal, um sistema de gestão executiva pessoal.

REGRAS OBRIGATÓRIAS:
1. Use APENAS os dados fornecidos. Nunca invente tarefas, projetos, reuniões ou eventos.
2. Sempre indique a origem: "Com base nas tarefas de hoje...", "Nos projetos ativos...", etc.
3. Se não houver dados suficientes, diga: "Não há dados suficientes para esta análise."
4. Seja conciso e prático. Máximo 400 palavras na resposta.
5. Use listas numeradas ou com traço quando listar mais de 2 itens.
6. Responda sempre em português brasileiro.
7. Se houver histórico de conversa anterior, mantenha coerência com o que foi dito antes.`

const MODE_PROMPTS: Record<Exclude<AIMode, 'chat'>, string> = {
  'resumo-dia':
    'Faça um resumo executivo do meu dia. Destaque: prioridades máximas, alertas críticos, compromissos importantes e o que pode aguardar.',
  planejamento:
    'Monte um plano prático para o meu dia em ordem de execução. Considere horários, prioridades e energia. Seja específico e direto.',
  'revisao-semanal':
    'Análise semanal: o que avancei (use as tarefas concluídas nos últimos 7 dias), o que ficou pendente, projetos em risco e as 3 principais prioridades para a próxima semana.',
  priorizar:
    'Liste as 5 tarefas/ações mais importantes para fazer hoje ou amanhã. Para cada uma, uma linha justificando o porquê.',
  'projetos-parados':
    'Para cada projeto sem movimentação recente, sugira uma próxima ação concreta e específica. Seja direto.',
  'gerar-ata':
    'Para cada reunião sem ata registrada, sugira uma estrutura com: objetivo presumido, tópicos a registrar e próximos passos. Base-se apenas nos dados disponíveis.',
}

async function fetchRecentHistory(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, limit = 5) {
  const { data } = await supabase
    .from('ai_interactions')
    .select('mode,question,answer,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

function formatHistory(
  history: Array<{ mode: string; question: string; answer: string; created_at: string }>,
): string {
  if (!history.length) return ''
  const lines = ['=== HISTÓRICO RECENTE DA CONVERSA ===']
  for (const item of [...history].reverse()) {
    const time = new Date(item.created_at).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    })
    if (item.mode === 'chat') {
      lines.push(`[${time}] Usuário: ${item.question}`)
      lines.push(`[${time}] Nexo IA: ${item.answer.slice(0, 300)}${item.answer.length > 300 ? '…' : ''}`)
    } else {
      lines.push(`[${time}] Modo "${item.mode}" executado.`)
    }
  }
  lines.push('')
  return lines.join('\n')
}

export async function askGemini(
  mode: AIMode,
  question: string,
): Promise<{ answer: string | null; interactionId: string | null; error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { answer: null, interactionId: null, error: 'Não autenticado' }

  const effectiveQuestion = mode === 'chat' ? question.trim() : MODE_PROMPTS[mode]
  if (!effectiveQuestion) return { answer: null, interactionId: null, error: 'Pergunta vazia' }

  let contextData: Awaited<ReturnType<typeof buildAIContext>>
  let contextStr: string
  try {
    contextData = await buildAIContext()
    contextStr = formatContextForPrompt(contextData)
  } catch {
    return { answer: null, interactionId: null, error: 'Erro ao buscar dados do sistema.' }
  }

  const history = await fetchRecentHistory(supabase, user.id)
  const historyStr = formatHistory(history)

  const prompt = `${SYSTEM_PROMPT}\n\n${contextStr}${historyStr ? `\n${historyStr}\n` : ''}\n=== SOLICITAÇÃO ===\n${effectiveQuestion}`
  const result = await callGemini(prompt)

  if (result.error || !result.text) {
    return { answer: null, interactionId: null, error: result.error ?? 'Sem resposta da IA' }
  }

  const { data: saved } = await supabase
    .from('ai_interactions')
    .insert({
      user_id: user.id,
      mode,
      question: effectiveQuestion,
      answer: result.text,
      context: contextData as unknown as import('@/lib/supabase/types').Json,
    })
    .select('id')
    .single()

  revalidatePath('/assistant')
  return { answer: result.text, interactionId: saved?.id ?? null, error: null }
}

export async function setAIFeedback(
  interactionId: string,
  feedback: 'helpful' | 'not_helpful',
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('ai_interactions')
    .update({ feedback })
    .eq('id', interactionId)
    .eq('user_id', user.id)

  return { error: error?.message ?? null }
}
