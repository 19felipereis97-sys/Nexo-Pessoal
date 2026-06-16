'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  FileText,
  FolderKanban,
  Lightbulb,
  Loader2,
  RotateCw,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Zap,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { PremiumTooltip } from '@/components/ui/premium-tooltip'
import { askGemini, setAIFeedback } from '@/lib/actions/ai'
import { executeInternalCommand, previewInternalCommand } from '@/lib/actions/ai-commands'
import type { AIInteraction, AIMode } from '@/lib/types/ai'
import type { AICommandPlan } from '@/lib/types/ai-command'
import type { AssistantData, AssistantPanel, AssistantRecommendation } from '@/lib/data/assistant'

interface AssistantClientProps {
  data: AssistantData
  initialQuestion?: string
  history: AIInteraction[]
}

const MODE_LABELS: Record<AIMode, string> = {
  chat: 'Chat livre',
  'resumo-dia': 'Resumo do dia',
  planejamento: 'Planejar dia',
  'revisao-semanal': 'Revisão semanal',
  priorizar: 'Priorizar tarefas',
  'projetos-parados': 'Projetos parados',
  'gerar-ata': 'Gerar ata',
}

const QUICK_ACTIONS: Array<{
  mode: Exclude<AIMode, 'chat'>
  icon: React.ElementType
  label: string
}> = [
  { mode: 'resumo-dia', icon: Sparkles, label: 'Resumo do dia' },
  { mode: 'planejamento', icon: CalendarDays, label: 'Planejar dia' },
  { mode: 'revisao-semanal', icon: BarChart3, label: 'Revisão semanal' },
  { mode: 'priorizar', icon: Zap, label: 'Priorizar' },
  { mode: 'projetos-parados', icon: FolderKanban, label: 'Projetos parados' },
  { mode: 'gerar-ata', icon: FileText, label: 'Gerar ata' },
]

const severityVariant: Record<string, 'accent' | 'warning' | 'danger' | 'success' | 'muted'> = {
  info: 'accent',
  warning: 'warning',
  danger: 'danger',
  success: 'success',
}

const entityIcon = {
  task: CheckCircle2,
  event: CalendarDays,
  project: FolderKanban,
  meeting: Clock,
  planning: Lightbulb,
}

function allItems(data: AssistantData) {
  return [
    ...data.panels.priorities.items,
    ...data.panels.projectsAttention.items,
    ...data.panels.reschedulableTasks.items,
    ...data.panels.meetingsWithoutMinutes.items,
    ...data.panels.weeklyPlan.items,
  ]
}

function RecommendationCard({ item }: { item: AssistantRecommendation }) {
  const router = useRouter()
  const Icon = entityIcon[item.entityType]

  return (
    <PremiumTooltip title="Por que apareceu?" content={item.reason} side="top" className="block">
      <button
        onClick={() => router.push(item.href)}
        className="group flex w-full items-start gap-3 rounded-xl border border-[#262626] bg-[#0a0a0a] p-3 text-left transition-all hover:border-[#c9a227]/40 hover:bg-[#111111]"
      >
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#262626] bg-[#111111] text-[#c9a227] transition-colors group-hover:border-[#c9a227]/30">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-1 text-sm font-medium text-[#f5f5f5]">{item.title}</span>
          <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#737373]">{item.description}</span>
          <span className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={severityVariant[item.severity] ?? 'muted'}>{item.severity}</Badge>
            {item.meta && <span className="text-[11px] text-[#525252]">{item.meta}</span>}
          </span>
        </span>
      </button>
    </PremiumTooltip>
  )
}

function AssistantPanelCard({ panel }: { panel: AssistantPanel }) {
  const Icon =
    panel.id === 'projectsAttention'
      ? FolderKanban
      : panel.id === 'reschedulableTasks'
        ? RotateCw
        : panel.id === 'meetingsWithoutMinutes'
          ? Clock
          : panel.id === 'weeklyPlan'
            ? Lightbulb
            : Sparkles

  return (
    <Card elevated className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#c9a227]/20 bg-[#c9a227]/10 text-[#c9a227]">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <CardTitle>{panel.title}</CardTitle>
            <CardDescription className="mt-1">{panel.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {panel.items.length === 0 ? (
          <EmptyState title={panel.emptyTitle} description={panel.emptyDescription} className="py-8" />
        ) : (
          panel.items.map((item) => <RecommendationCard key={item.id} item={item} />)
        )}
      </CardContent>
    </Card>
  )
}

function AIResponseText({ text }: { text: string }) {
  const paragraphs = text.split('\n').filter((line) => line.trim() !== '')
  return (
    <div className="space-y-2 text-sm leading-relaxed text-[#e5e5e5]">
      {paragraphs.map((paragraph, i) => {
        const isList = /^[-•*\d]/.test(paragraph.trim())
        if (isList) {
          return (
            <p key={i} className="pl-2 text-[#d4d4d4]">
              {paragraph}
            </p>
          )
        }
        return <p key={i}>{paragraph}</p>
      })}
    </div>
  )
}

function HistoryItem({ item }: { item: AIInteraction }) {
  const [open, setOpen] = useState(false)
  const label = MODE_LABELS[item.mode as AIMode] ?? item.mode
  const date = new Date(item.created_at).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="rounded-lg border border-[#1f1f1f] bg-[#0a0a0a]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 p-2.5 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="line-clamp-1 text-xs font-medium text-[#d4d4d4]">
            {item.mode === 'chat' ? item.question : label}
          </span>
          <span className="text-[10px] text-[#525252]">{date}</span>
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {item.feedback === 'helpful' && <ThumbsUp className="h-3 w-3 text-emerald-500" />}
          {item.feedback === 'not_helpful' && <ThumbsDown className="h-3 w-3 text-[#737373]" />}
          <ChevronDown
            className={`h-3.5 w-3.5 text-[#525252] transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
      {open && (
        <div className="border-t border-[#1f1f1f] px-2.5 pb-2.5 pt-2">
          <p className="text-xs leading-relaxed text-[#737373] line-clamp-6">{item.answer}</p>
        </div>
      )}
    </div>
  )
}

export function AssistantClient({ data, initialQuestion, history }: AssistantClientProps) {
  const router = useRouter()
  const hasAnyInsight = useMemo(() => allItems(data).length > 0, [data])

  const [aiQuestion, setAiQuestion] = useState(initialQuestion ?? '')
  const [aiPending, startAiTransition] = useTransition()
  const [commandPending, startCommandTransition] = useTransition()
  const [aiAnswer, setAiAnswer] = useState<{ text: string; interactionId: string | null } | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [commandText, setCommandText] = useState('')
  const [commandPlan, setCommandPlan] = useState<AICommandPlan | null>(null)
  const [commandId, setCommandId] = useState<string | null>(null)
  const [commandError, setCommandError] = useState<string | null>(null)
  const [commandHref, setCommandHref] = useState<string | null>(null)
  const [aiFeedback, setAiFeedbackState] = useState<'helpful' | 'not_helpful' | null>(null)
  const [localHistory, setLocalHistory] = useState<AIInteraction[]>(history)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  function sendToAI(modeOverride?: AIMode) {
    const mode: AIMode = modeOverride ?? 'chat'
    if (mode === 'chat' && !aiQuestion.trim()) return
    setAiAnswer(null)
    setAiError(null)
    setAiFeedbackState(null)
    setCopied(false)
    startAiTransition(async () => {
      const result = await askGemini(mode, aiQuestion)
      if (result.error) {
        setAiError(result.error)
      } else if (result.answer) {
        setAiAnswer({ text: result.answer, interactionId: result.interactionId })
        if (result.interactionId) {
          const newItem: AIInteraction = {
            id: result.interactionId,
            user_id: '',
            mode,
            question: mode === 'chat' ? aiQuestion : MODE_LABELS[mode],
            answer: result.answer,
            context: null,
            feedback: null,
            created_at: new Date().toISOString(),
          }
          setLocalHistory((prev) => [newItem, ...prev].slice(0, 10))
        }
      }
    })
  }

  function previewCommand() {
    if (!commandText.trim()) return
    setCommandPlan(null)
    setCommandId(null)
    setCommandError(null)
    setCommandHref(null)
    startCommandTransition(async () => {
      const result = await previewInternalCommand(commandText)
      if (result.error) {
        setCommandError(result.error)
        return
      }
      setCommandPlan(result.plan)
      setCommandId(result.commandId)
    })
  }

  function confirmCommand() {
    if (!commandId || !commandPlan?.canExecute) return
    setCommandError(null)
    setCommandHref(null)
    startCommandTransition(async () => {
      const result = await executeInternalCommand(commandId)
      if (result.error) {
        setCommandError(result.error)
        return
      }
      if (result.href) setCommandHref(result.href)
    })
  }

  async function handleFeedback(fb: 'helpful' | 'not_helpful') {
    if (!aiAnswer?.interactionId || aiFeedback) return
    setAiFeedbackState(fb)
    await setAIFeedback(aiAnswer.interactionId, fb)
    setLocalHistory((prev) =>
      prev.map((h) => (h.id === aiAnswer.interactionId ? { ...h, feedback: fb } : h)),
    )
  }

  function copyAnswer() {
    if (!aiAnswer) return
    navigator.clipboard.writeText(aiAnswer.text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  useEffect(() => {
    if (!initialQuestion) return
    const timer = setTimeout(() => sendToAI('chat'), 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion])

  if (data.error) {
    return <ErrorState title="Assistente indisponivel" message={data.error} />
  }

  return (
    <div className="nexo-aura -m-4 min-h-full p-4 md:-m-6 md:p-6">
      <div className="relative z-10 mx-auto max-w-[1500px]">
        <PageHeader
          title="Assistente"
          description="Análise por regras internas + IA Gemini para perguntas livres e análises profundas."
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
          {/* Coluna principal — painéis de regras */}
          <div className="space-y-4">
            <Card elevated>
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-[#c9a227]" /> Resumo do dia
                  </CardTitle>
                  <CardDescription className="mt-1">{data.todayLabel}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                  {(
                    [
                      ['Tarefas hoje', data.summary.todayTasks],
                      ['Vencidas', data.summary.overdueTasks],
                      ['Agenda hoje', data.summary.todayEvents],
                      ['Criticas paradas', data.summary.criticalNotStarted],
                      ['Projetos parados', data.summary.staleProjects],
                      ['Atas pendentes', data.summary.meetingsWithoutMinutes],
                    ] as [string, number][]
                  ).map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-[#262626] bg-[#0a0a0a] p-3">
                      <p className="text-2xl font-semibold text-[#f5f5f5]">{value}</p>
                      <p className="mt-1 text-xs text-[#737373]">{label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {!hasAnyInsight && (
              <Card>
                <EmptyState
                  icon={<Sparkles className="h-5 w-5" />}
                  title="Sem recomendacoes por enquanto"
                  description="Crie tarefas, projetos, agenda e reunioes para o assistente montar leituras mais uteis."
                />
              </Card>
            )}

            <div className="grid gap-4 xl:grid-cols-2">
              <AssistantPanelCard panel={data.panels.priorities} />
              <AssistantPanelCard panel={data.panels.projectsAttention} />
              <AssistantPanelCard panel={data.panels.reschedulableTasks} />
              <AssistantPanelCard panel={data.panels.meetingsWithoutMinutes} />
            </div>

            <AssistantPanelCard panel={data.panels.weeklyPlan} />
          </div>

          {/* Coluna lateral — Gemini IA */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Card elevated className="overflow-hidden border-[#c9a227]/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#c9a227]/20 bg-[#c9a227]/10 text-[#c9a227]">
                    <Zap className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <CardTitle>Executor interno</CardTitle>
                    <CardDescription className="mt-0.5 text-[10px]">
                      Cria tarefas, notas e compromissos com confirmação.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-[#262626] bg-[#0a0a0a] p-2">
                  <textarea
                    value={commandText}
                    onChange={(e) => setCommandText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault()
                        previewCommand()
                      }
                    }}
                    placeholder="Ex: criar tarefa revisar contrato amanhã às 9h prioridade alta"
                    disabled={commandPending}
                    rows={3}
                    className="w-full resize-none bg-transparent text-sm leading-relaxed text-[#f5f5f5] placeholder:text-[#525252] focus:outline-none disabled:opacity-50"
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-[#525252]">Ctrl + Enter para analisar</span>
                    <Button size="sm" variant="accent" onClick={previewCommand} loading={commandPending} disabled={!commandText.trim() || commandPending}>
                      Analisar
                    </Button>
                  </div>
                </div>

                {commandPlan && (
                  <div className="space-y-3 rounded-xl border border-[#262626] bg-[#111111] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#f5f5f5]">{commandPlan.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-[#737373]">{commandPlan.summary}</p>
                      </div>
                      <Badge variant={commandPlan.canExecute ? 'success' : 'warning'}>
                        {Math.round(commandPlan.confidence * 100)}%
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      {commandPlan.fields.map((field) => (
                        <div key={field.label} className="flex items-center justify-between gap-3 rounded-lg bg-[#0a0a0a] px-2.5 py-2">
                          <span className="text-[11px] text-[#737373]">{field.label}</span>
                          <span className="truncate text-right text-xs font-medium text-[#d4d4d4]">{field.value}</span>
                        </div>
                      ))}
                    </div>

                    {commandPlan.warnings.length > 0 && (
                      <div className="rounded-lg border border-yellow-900/30 bg-yellow-950/10 p-2">
                        {commandPlan.warnings.map((warning) => (
                          <p key={warning} className="text-xs text-yellow-300">{warning}</p>
                        ))}
                      </div>
                    )}

                    <Button
                      variant="accent"
                      size="sm"
                      className="w-full"
                      onClick={confirmCommand}
                      loading={commandPending}
                      disabled={!commandPlan.canExecute || !commandId || commandPending || !!commandHref}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Confirmar e executar
                    </Button>
                  </div>
                )}

                {commandError && (
                  <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3">
                    <p className="text-xs leading-relaxed text-red-300">{commandError}</p>
                  </div>
                )}

                {commandHref && (
                  <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3">
                    <p className="text-xs font-medium text-emerald-300">Ação executada com sucesso.</p>
                    <Button size="sm" variant="secondary" className="mt-2 w-full" onClick={() => router.push(commandHref)}>
                      Abrir item criado
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card elevated className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#c9a227]/20 bg-[#c9a227]/10 text-[#c9a227]">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <CardTitle>Nexo IA</CardTitle>
                    <CardDescription className="mt-0.5 text-[10px]">
                      Gemini 2.0 Flash · Contexto real do sistema
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Ações rápidas */}
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_ACTIONS.map(({ mode, icon: Icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => sendToAI(mode)}
                      disabled={aiPending}
                      className="flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#111111] px-2.5 py-1.5 text-[11px] text-[#a3a3a3] transition-all hover:border-[#c9a227]/30 hover:text-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Icon className="h-3 w-3" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Input de texto livre */}
                <div className="flex items-center gap-2 rounded-xl border border-[#262626] bg-[#0a0a0a] px-3 py-2 focus-within:border-[#c9a227]/40">
                  <input
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendToAI('chat')
                      }
                    }}
                    placeholder="Pergunte qualquer coisa sobre seus dados..."
                    disabled={aiPending}
                    className="min-w-0 flex-1 bg-transparent text-sm text-[#f5f5f5] placeholder:text-[#525252] focus:outline-none disabled:opacity-50"
                  />
                  <Button
                    size="icon"
                    variant="accent"
                    onClick={() => sendToAI('chat')}
                    loading={aiPending}
                    disabled={!aiQuestion.trim() || aiPending}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Estado de carregamento */}
                {aiPending && (
                  <div className="flex items-center gap-2 rounded-xl border border-[#c9a227]/20 bg-[#c9a227]/5 p-3">
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#c9a227]" />
                    <p className="text-xs text-[#a3a3a3]">Analisando seus dados com IA...</p>
                  </div>
                )}

                {/* Erro */}
                {aiError && !aiPending && (
                  <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                      <p className="text-xs leading-relaxed text-red-300">{aiError}</p>
                    </div>
                  </div>
                )}

                {/* Resposta da IA */}
                {aiAnswer && !aiPending && (
                  <div className="space-y-2">
                    <div className="rounded-xl border border-[#c9a227]/20 bg-[#c9a227]/5 p-3">
                      <AIResponseText text={aiAnswer.text} />
                    </div>

                    {/* Feedback + copiar */}
                    <div className="flex items-center justify-between gap-2 px-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-[#525252]">Foi útil?</span>
                        <button
                          onClick={() => handleFeedback('helpful')}
                          disabled={!!aiFeedback}
                          title="Útil"
                          className={`rounded-md p-1 transition-colors ${
                            aiFeedback === 'helpful'
                              ? 'text-emerald-400'
                              : 'text-[#525252] hover:text-emerald-400 disabled:opacity-40'
                          }`}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleFeedback('not_helpful')}
                          disabled={!!aiFeedback}
                          title="Não útil"
                          className={`rounded-md p-1 transition-colors ${
                            aiFeedback === 'not_helpful'
                              ? 'text-[#737373]'
                              : 'text-[#525252] hover:text-[#737373] disabled:opacity-40'
                          }`}
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                        </button>
                        {aiFeedback && (
                          <span className="text-[10px] text-[#525252]">
                            {aiFeedback === 'helpful' ? 'Obrigado!' : 'Registrado.'}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={copyAnswer}
                        className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] text-[#525252] transition-colors hover:text-[#a3a3a3]"
                      >
                        <Copy className="h-3 w-3" />
                        {copied ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Estado vazio */}
                {!aiAnswer && !aiError && !aiPending && (
                  <EmptyState
                    icon={<Bot className="h-5 w-5" />}
                    title="Pergunte à IA"
                    description="Use os botões rápidos ou escreva sua própria pergunta."
                    className="py-6"
                  />
                )}
              </CardContent>
            </Card>

            {/* Histórico */}
            {localHistory.length > 0 && (
              <Card elevated>
                <CardHeader className="pb-2">
                  <button
                    onClick={() => setHistoryOpen((v) => !v)}
                    className="flex w-full items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">Histórico</CardTitle>
                      <Badge variant="muted">{localHistory.length}</Badge>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-[#525252] transition-transform ${historyOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                </CardHeader>
                {historyOpen && (
                  <CardContent className="space-y-2">
                    {localHistory.map((item) => (
                      <HistoryItem key={item.id} item={item} />
                    ))}
                  </CardContent>
                )}
              </Card>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
