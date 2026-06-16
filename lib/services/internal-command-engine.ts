import { addDaysISO, todayISO } from '@/lib/utils/date'
import type { AICommandPlan } from '@/lib/types/ai-command'

const PRIORITIES = ['baixa', 'média', 'media', 'alta', 'critica', 'crítica']

function normalize(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function cleanTitle(text: string) {
  return text
    .replace(/^(crie|criar|adicione|adicionar|registre|registrar|agenda|agende|marque|nova|novo)\s+/i, '')
    .replace(/^(uma|um|a|o)\s+/i, '')
    .replace(/^(tarefa|compromisso|evento|nota|anotacao|anotação)\s*/i, '')
    .replace(/\b(hoje|amanha|amanhã|depois de amanha|depois de amanhã)\b/gi, '')
    .replace(/\b(as|às|para|pra)\s+\d{1,2}(:\d{2})?\s*h?\b/gi, '')
    .replace(/\bprioridade\s+(baixa|média|media|alta|critica|crítica)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseDate(text: string) {
  const n = normalize(text)
  const today = todayISO()
  if (n.includes('depois de amanha')) return addDaysISO(today, 2)
  if (n.includes('amanha')) return addDaysISO(today, 1)
  if (n.includes('hoje')) return today
  const explicit = text.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/)
  if (!explicit) return undefined
  const day = explicit[1].padStart(2, '0')
  const month = explicit[2].padStart(2, '0')
  const year = explicit[3]
    ? explicit[3].length === 2 ? `20${explicit[3]}` : explicit[3]
    : today.slice(0, 4)
  return `${year}-${month}-${day}`
}

function parseTime(text: string) {
  const match = normalize(text).match(/\b(?:as|a|às|para|pra)?\s*(\d{1,2})(?::(\d{2}))?\s*h?\b/)
  if (!match) return undefined
  const hour = Number(match[1])
  if (hour > 23) return undefined
  const minute = match[2] ? Number(match[2]) : 0
  if (minute > 59) return undefined
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function parsePriority(text: string) {
  const n = normalize(text)
  const found = PRIORITIES.find((priority) => n.includes(`prioridade ${normalize(priority)}`) || n.includes(normalize(priority)))
  if (!found) return undefined
  return normalize(found) === 'media' ? 'média' : normalize(found) === 'critica' ? 'critica' : found
}

function buildEventISO(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString()
}

function addMinutes(date: string, time: string, minutes: number) {
  return new Date(new Date(`${date}T${time}:00`).getTime() + minutes * 60000).toISOString()
}

function unknownPlan(rawText: string): AICommandPlan {
  return {
    intent: 'unknown',
    title: 'Comando não reconhecido',
    summary: `Não consegui transformar "${rawText}" em uma ação segura.`,
    confidence: 0.2,
    payload: {},
    fields: [],
    warnings: ['Tente começar com "criar tarefa", "criar nota" ou "agendar compromisso".'],
    canExecute: false,
  }
}

export function interpretInternalCommand(rawText: string): AICommandPlan {
  const text = rawText.trim()
  const n = normalize(text)
  if (!text) return unknownPlan(text)

  if (/\b(tarefa|task|to-do|todo)\b/.test(n) || /^(crie|criar|adicione|adicionar)\b/.test(n)) {
    const title = cleanTitle(text)
    const dueDate = parseDate(text)
    const dueTime = parseTime(text)
    const priority = parsePriority(text) ?? 'média'
    const warnings = []
    if (!title) warnings.push('Não encontrei um título claro para a tarefa.')
    if (!dueDate) warnings.push('Sem data detectada. A tarefa será criada sem prazo.')
    const payload = {
      title: title || text,
      priority,
      status: 'a-fazer',
      due_date: dueDate,
      due_time: dueTime,
    }
    return {
      intent: 'create_task',
      title: 'Criar tarefa',
      summary: `Criar tarefa "${payload.title}".`,
      confidence: title ? 0.82 : 0.55,
      payload,
      fields: [
        { label: 'Título', value: String(payload.title) },
        { label: 'Prioridade', value: priority },
        { label: 'Prazo', value: dueDate ? `${dueDate}${dueTime ? ` às ${dueTime}` : ''}` : 'Sem prazo' },
      ],
      warnings,
      canExecute: !!title,
    }
  }

  if (/\b(nota|anotacao|anotação|ideia|registro)\b/.test(n)) {
    const title = cleanTitle(text)
    const payload = {
      title: title || 'Nota rápida',
      content: text,
      type: n.includes('ideia') ? 'ideia' : 'nota_rapida',
    }
    return {
      intent: 'create_note',
      title: 'Criar nota',
      summary: `Criar nota "${payload.title}".`,
      confidence: 0.78,
      payload,
      fields: [
        { label: 'Título', value: payload.title },
        { label: 'Tipo', value: payload.type },
      ],
      warnings: [],
      canExecute: true,
    }
  }

  if (/\b(compromisso|evento|agenda|agende|marque)\b/.test(n)) {
    const title = cleanTitle(text)
    const date = parseDate(text) ?? todayISO()
    const time = parseTime(text)
    const warnings = []
    if (!title) warnings.push('Não encontrei um título claro para o compromisso.')
    if (!time) warnings.push('Informe um horário. Exemplo: "amanhã às 14h".')
    const payload = {
      title: title || text,
      start_at: time ? buildEventISO(date, time) : '',
      end_at: time ? addMinutes(date, time, 60) : '',
      type: 'compromisso',
    }
    return {
      intent: 'create_event',
      title: 'Criar compromisso',
      summary: `Agendar compromisso "${payload.title}".`,
      confidence: title && time ? 0.84 : 0.5,
      payload,
      fields: [
        { label: 'Título', value: String(payload.title) },
        { label: 'Início', value: time ? `${date} às ${time}` : 'Horário não identificado' },
        { label: 'Duração', value: '60 min' },
      ],
      warnings,
      canExecute: !!title && !!time,
    }
  }

  return unknownPlan(text)
}
