import type { ReportData } from '@/lib/data/reports'

export function exportReportCSV(data: ReportData, periodStart: string, periodEnd: string): void {
  const fmtDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('pt-BR', { dateStyle: 'short' }) } catch { return iso }
  }

  const rows: string[][] = [
    ['Relatório Nexo Pessoal', `Período: ${periodStart} a ${periodEnd}`],
    [],
    ['── RESUMO ──'],
    ['Indicador', 'Valor'],
    ['Tarefas concluídas', String(data.completedTasks.length)],
    ['Tarefas pendentes', String(data.pendingTasks.length)],
    ['Tarefas vencidas', String(data.overdueTasks.length)],
    ['Reuniões realizadas', String(data.meetingsDone.length)],
    ['Reuniões sem ata', String(data.meetingsNoMinutes.length)],
    ['Notas criadas', String(data.notesCreated.length)],
    ['Documentos enviados', String(data.documentsInPeriod.length)],
    ['Logs de rotinas', String(data.routineLogsInPeriod.length)],
    ['Projetos com avanço', String(data.progressedProjects.length)],
    ['Projetos parados', String(data.staleProjects.length)],
    ['Compromissos na agenda', String(data.eventsInPeriod.length)],
    [],
    ['── TAREFAS CONCLUÍDAS ──'],
    ['Título', 'Prioridade', 'Projeto', 'Concluída em'],
    ...data.completedTasks.map((t) => [
      t.title, t.priority, '', t.completed_at ? fmtDate(t.completed_at) : '',
    ]),
    [],
    ['── TAREFAS VENCIDAS ──'],
    ['Título', 'Prioridade', 'Vencimento'],
    ...data.overdueTasks.map((t) => [t.title, t.priority, t.due_date ?? '']),
    [],
    ['── REUNIÕES REALIZADAS ──'],
    ['Título', 'Data', 'Ata'],
    ...data.meetingsDone.map((m) => [m.title, fmtDate(m.scheduled_at), m.minutes ? 'Sim' : 'Não']),
    [],
    ['── DOCUMENTOS ENVIADOS ──'],
    ['Título', 'Tipo', 'Tamanho', 'Data'],
    ...data.documentsInPeriod.map((d) => [
      d.title,
      d.file_type ?? '',
      d.file_size ? `${(d.file_size / 1024).toFixed(1)} KB` : '',
      fmtDate(d.uploaded_at),
    ]),
    [],
    ['── NOTAS CRIADAS ──'],
    ['Título', 'Data'],
    ...data.notesCreated.map((n) => [n.title, fmtDate(n.created_at)]),
  ]

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `relatorio-nexo-${periodStart}-${periodEnd}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function buildAutoReview(data: ReportData, periodStart: string, periodEnd: string) {
  const completed = data.completedTasks.length
  const overdue = data.overdueTasks.length
  const meetings = data.meetingsDone.length
  const decisions = data.decisions.length
  const logs = data.routineLogsInPeriod.length
  const docs = data.documentsInPeriod.length

  const summary = [
    `Período: ${periodStart} a ${periodEnd}.`,
    completed > 0
      ? `${completed} tarefa${completed !== 1 ? 's' : ''} concluída${completed !== 1 ? 's' : ''}.`
      : 'Nenhuma tarefa concluída no período.',
    overdue > 0 ? `${overdue} tarefa${overdue !== 1 ? 's' : ''} em atraso.` : '',
    meetings > 0 ? `${meetings} reunião${meetings !== 1 ? 'ões' : ''} realizada${meetings !== 1 ? 's' : ''}.` : '',
    decisions > 0 ? `${decisions} decisão${decisions !== 1 ? 'ões' : ''} registrada${decisions !== 1 ? 's' : ''}.` : '',
    logs > 0 ? `${logs} conclusão${logs !== 1 ? 'ões' : ''} de rotinas.` : '',
    docs > 0 ? `${docs} documento${docs !== 1 ? 's' : ''} enviado${docs !== 1 ? 's' : ''}.` : '',
  ].filter(Boolean).join(' ')

  const wins = [
    ...data.completedTasks.slice(0, 5).map((t) => `• ${t.title}`),
    ...data.decisions.slice(0, 2).map((d) => `• Decisão: ${d.title}`),
  ].join('\n') || 'Registre suas conquistas manualmente.'

  const pendingLines = [
    ...data.overdueTasks.slice(0, 3).map((t) => `• [ATRASADA] ${t.title}`),
    ...data.meetingsNoMinutes.slice(0, 3).map((m) => `• [ATA PENDENTE] ${m.title}`),
    ...data.staleProjects.slice(0, 2).map((p) => `• [PROJETO PARADO] ${p.name}`),
  ]
  const pending_items = pendingLines.join('\n') || 'Nenhuma pendência crítica identificada.'

  const focusLines = [
    ...data.overdueTasks.slice(0, 2).map((t) => `• Concluir: ${t.title}`),
    ...data.staleProjects.slice(0, 2).map((p) => `• Destravar: ${p.name}`),
    ...data.meetingsNoMinutes.slice(0, 1).map((m) => `• Registrar ata: ${m.title}`),
  ]
  const next_focus = focusLines.join('\n') || 'Defina as prioridades para o próximo período.'

  return { summary, wins, pending_items, next_focus }
}
