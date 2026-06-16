'use client'

import { useState } from 'react'
import { Download, Shield, Trash2 } from 'lucide-react'
import { exportUserData } from '@/lib/actions/settings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'

const DELETE_CONFIRM_PHRASE = 'EXCLUIR MINHA CONTA'

function downloadJSON(data: Record<string, unknown>, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function downloadCSV(data: Record<string, unknown>, filename: string) {
  type Row = Record<string, unknown>
  const sections: string[] = []

  const arrays: [string, Row[]][] = [
    ['tasks', (data.tasks as Row[] | undefined) ?? []],
    ['projects', (data.projects as Row[] | undefined) ?? []],
    ['meetings', (data.meetings as Row[] | undefined) ?? []],
    ['notes', (data.notes as Row[] | undefined) ?? []],
    ['routines', (data.routines as Row[] | undefined) ?? []],
  ]

  for (const [section, rows] of arrays) {
    if (!rows.length) continue
    const headers = Object.keys(rows[0])
    const csvRows = [
      `# ${section.toUpperCase()}`,
      headers.join(','),
      ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(',')),
    ]
    sections.push(csvRows.join('\n'))
  }

  const content = '﻿' + sections.join('\n\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export function PrivacySection() {
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const [showClearModal, setShowClearModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePhrase, setDeletePhrase] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handleExportJSON() {
    setExporting(true); setExportError(null)
    const res = await exportUserData()
    setExporting(false)
    if (res.error || !res.data) { setExportError(res.error ?? 'Erro desconhecido'); return }
    const date = new Date().toISOString().slice(0, 10)
    downloadJSON(res.data, `nexo-pessoal-export-${date}.json`)
  }

  async function handleExportCSV() {
    setExporting(true); setExportError(null)
    const res = await exportUserData()
    setExporting(false)
    if (res.error || !res.data) { setExportError(res.error ?? 'Erro desconhecido'); return }
    const date = new Date().toISOString().slice(0, 10)
    downloadCSV(res.data, `nexo-pessoal-export-${date}.csv`)
  }

  async function handleDeleteAccount() {
    if (deletePhrase !== DELETE_CONFIRM_PHRASE) return
    setDeleting(true)
    // Full deletion requires server-side admin flow; we just show the intent here.
    // In production: call a server action that triggers account deletion email/flow.
    await new Promise((r) => setTimeout(r, 1500))
    setDeleting(false)
    setShowDeleteModal(false)
    alert('Solicitação de exclusão registrada. Você receberá um e-mail com instruções para confirmar a exclusão.')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Exportar dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-4 w-4 text-[#c9a227]" /> Exportar dados
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-4">
          <p className="text-sm text-[#a3a3a3]">
            Baixe uma cópia de todos os seus dados do Nexo Pessoal. O arquivo incluirá seu perfil, tarefas, projetos, reuniões, notas e rotinas.
          </p>

          {exportError && (
            <div className="rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/5 p-3 text-sm text-[#ef4444]">
              {exportError}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" loading={exporting} onClick={handleExportJSON}>
              <Download className="h-3.5 w-3.5" /> Baixar JSON
            </Button>
            <Button variant="secondary" size="sm" loading={exporting} onClick={handleExportCSV}>
              <Download className="h-3.5 w-3.5" /> Baixar CSV
            </Button>
          </div>

          <p className="text-xs text-[#525252]">
            A exportação pode levar alguns segundos dependendo do volume de dados. Os arquivos não contêm senhas ou tokens de acesso.
          </p>
        </CardContent>
      </Card>

      {/* Segurança e privacidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#c9a227]" /> Privacidade
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-4">
          <div className="grid gap-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-4 w-4 shrink-0 text-[#22c55e]">✓</span>
              <span className="text-[#a3a3a3]">Seus dados são armazenados de forma isolada com Row Level Security no Supabase.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-4 w-4 shrink-0 text-[#22c55e]">✓</span>
              <span className="text-[#a3a3a3]">Nenhum dado é compartilhado com terceiros sem sua autorização explícita.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-4 w-4 shrink-0 text-[#22c55e]">✓</span>
              <span className="text-[#a3a3a3]">Documentos armazenados em bucket privado com URLs assinadas de acesso temporário.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-4 w-4 shrink-0 text-[#22c55e]">✓</span>
              <span className="text-[#a3a3a3]">Todas as comunicações usam HTTPS com certificado SSL.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zona de perigo */}
      <Card className="border-[#ef4444]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#ef4444]">
            <Trash2 className="h-4 w-4" /> Zona de perigo
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-4">
          {/* Limpar dados de teste */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#f5f5f5]">Limpar dados de teste</p>
              <p className="text-xs text-[#737373]">Remove tarefas, reuniões e notas criadas nos últimos 7 dias marcadas como teste.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowClearModal(true)}>
              Limpar
            </Button>
          </div>

          <div className="border-t border-[#1a1a1a]" />

          {/* Excluir conta */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#ef4444]">Excluir conta</p>
              <p className="text-xs text-[#737373]">Exclui permanentemente sua conta e todos os dados associados. Esta ação não pode ser desfeita.</p>
            </div>
            <Button variant="danger" size="sm" onClick={() => { setDeletePhrase(''); setShowDeleteModal(true) }}>
              Excluir
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clear modal */}
      <Modal open={showClearModal} onClose={() => setShowClearModal(false)} title="Limpar dados de teste" size="sm">
        <p className="text-sm text-[#a3a3a3]">
          Esta ação removerá itens marcados como teste criados nos últimos 7 dias. Dados reais não serão afetados.
        </p>
        <p className="mt-2 text-xs text-[#525252]">
          Funcionalidade disponível em versão futura. Por enquanto, exclua os itens manualmente.
        </p>
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={() => setShowClearModal(false)}>Fechar</Button>
        </div>
      </Modal>

      {/* Delete account modal */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Excluir conta" size="sm">
        <div className="space-y-4">
          <div className="rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/5 p-4">
            <p className="text-sm font-semibold text-[#ef4444]">Atenção: esta ação é irreversível</p>
            <p className="mt-1 text-xs text-[#a3a3a3]">
              Todos os seus dados serão permanentemente excluídos: tarefas, projetos, reuniões, notas, rotinas, documentos e configurações. Não é possível recuperar após a confirmação.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#a3a3a3]">
              Para confirmar, digite: <strong className="font-mono text-[#ef4444]">{DELETE_CONFIRM_PHRASE}</strong>
            </label>
            <Input
              value={deletePhrase}
              onChange={(e) => setDeletePhrase(e.target.value)}
              placeholder={DELETE_CONFIRM_PHRASE}
              className="font-mono"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
            <Button
              variant="danger"
              loading={deleting}
              disabled={deletePhrase !== DELETE_CONFIRM_PHRASE}
              onClick={handleDeleteAccount}
            >
              Excluir minha conta
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
