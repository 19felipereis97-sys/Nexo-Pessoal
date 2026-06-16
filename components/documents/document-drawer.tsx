'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, ArchiveRestore, Copy, Download, ExternalLink, File, FileText, Image, Pencil, Tag, Trash2 } from 'lucide-react'
import { archiveDocument, deleteDocument, getDocumentDownloadUrl, getDocumentSignedUrl, restoreDocument } from '@/lib/actions/documents'
import { FILE_TYPE_CONFIG, formatFileSize, getFileExt } from '@/lib/utils/documents'
import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import type { DocumentWithRefs } from '@/lib/data/documents'

interface Props {
  document: DocumentWithRefs | null
  onClose: () => void
  onEdit: (doc: DocumentWithRefs) => void
  onDeleted: (id: string) => void
}

export function DocumentDrawer({ document: doc, onClose, onEdit, onDeleted }: Props) {
  const router = useRouter()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const ext = doc ? getFileExt(doc.file_name) : ''
  const config = FILE_TYPE_CONFIG[ext] ?? { color: '#737373', label: ext.toUpperCase(), isImage: false, isPdf: false }
  const canPreview = config.isImage || config.isPdf

  useEffect(() => {
    if (!doc || !canPreview) {
      const timer = setTimeout(() => setPreviewUrl(null), 0)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => setPreviewLoading(true), 0)
    getDocumentSignedUrl(doc.id, 3600).then(({ url }) => {
      setPreviewUrl(url)
      setPreviewLoading(false)
    })
    return () => clearTimeout(timer)
  }, [doc?.id, canPreview]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDownload() {
    if (!doc) return
    const { url, error } = await getDocumentDownloadUrl(doc.id)
    if (error || !url) return
    const a = window.document.createElement('a')
    a.href = url
    a.download = doc.file_name
    a.click()
  }

  async function handleCopyLink() {
    if (!doc) return
    const { url, error } = await getDocumentSignedUrl(doc.id, 3600)
    if (error || !url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleArchive() {
    if (!doc) return
    setBusy(true)
    await (doc.status === 'archived' ? restoreDocument(doc.id) : archiveDocument(doc.id))
    router.refresh()
    onClose()
  }

  async function handleDelete() {
    if (!doc) return
    setBusy(true)
    await deleteDocument(doc.id)
    router.refresh()
    onDeleted(doc.id)
    setConfirmDelete(false)
    onClose()
  }

  const uploadedAt = doc ? new Date(doc.uploaded_at).toLocaleDateString('pt-BR', { dateStyle: 'medium' }) : ''

  return (
    <>
      <Drawer open={!!doc} onClose={onClose} title={doc?.title ?? ''} width="w-[480px]">
        {doc && (
          <div className="flex flex-col gap-5">
            {/* Preview */}
            {canPreview && (
              <div className="overflow-hidden rounded-xl border border-[#262626] bg-[#0a0a0a]">
                {previewLoading ? (
                  <div className="flex h-48 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#c9a227] border-t-transparent" />
                  </div>
                ) : previewUrl ? (
                  config.isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt={doc.title} className="max-h-64 w-full object-contain" />
                  ) : (
                    <iframe src={previewUrl} title={doc.title} className="h-64 w-full border-0" />
                  )
                ) : (
                  <div className="flex h-48 items-center justify-center text-xs text-[#737373]">Pré-visualização indisponível</div>
                )}
              </div>
            )}

            {/* File icon for non-previewable */}
            {!canPreview && (
              <div className="flex items-center gap-4 rounded-xl border border-[#262626] bg-[#0d0d0d] p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#262626] bg-[#111]">
                  <FileText className="h-6 w-6" style={{ color: config.color }} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#f5f5f5]">{doc.file_name}</p>
                  <p className="text-xs text-[#737373]">{formatFileSize(doc.file_size)} · {config.label}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-3 gap-2">
              <Button variant="secondary" size="sm" className="flex-col gap-1 h-auto py-2.5 text-xs" onClick={handleDownload}>
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button variant="secondary" size="sm" className="flex-col gap-1 h-auto py-2.5 text-xs" onClick={handleCopyLink}>
                {copied ? <Copy className="h-4 w-4 text-[#22c55e]" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado!' : 'Copiar link'}
              </Button>
              <Button variant="secondary" size="sm" className="flex-col gap-1 h-auto py-2.5 text-xs" onClick={() => onEdit(doc)}>
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </div>

            {/* Description */}
            {doc.description && (
              <p className="text-sm text-[#a3a3a3]">{doc.description}</p>
            )}

            {/* Meta */}
            <div className="space-y-2.5">
              <MetaRow label="Tipo" value={config.label} dot={config.color} />
              <MetaRow label="Tamanho" value={formatFileSize(doc.file_size)} />
              <MetaRow label="Enviado em" value={uploadedAt} />
              {doc.category && <MetaRow label="Categoria" value={doc.category} />}
              {doc.project_name && <MetaRow label="Projeto" value={doc.project_name} />}
              {doc.task_title && <MetaRow label="Tarefa" value={doc.task_title} />}
              {doc.meeting_title && <MetaRow label="Reunião" value={doc.meeting_title} />}
              {doc.note_title && <MetaRow label="Nota" value={doc.note_title} />}
            </div>

            {/* Tags */}
            {doc.tags && doc.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <Tag className="h-3.5 w-3.5 shrink-0 text-[#737373] mt-0.5" />
                {doc.tags.map((tag) => (
                  <Badge key={tag} variant="muted">{tag}</Badge>
                ))}
              </div>
            )}

            {/* Open in new tab (PDF/image) */}
            {previewUrl && (
              <a href={previewUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-[#c9a227] hover:underline">
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir em nova aba
              </a>
            )}

            <div className="border-t border-[#1f1f1f]" />

            {/* Danger zone */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-[#737373] hover:text-[#f5f5f5]"
                onClick={handleArchive}
                disabled={busy}
              >
                {doc.status === 'archived'
                  ? <><ArchiveRestore className="h-3.5 w-3.5" /> Restaurar</>
                  : <><Archive className="h-3.5 w-3.5" /> Arquivar</>}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#ef4444] hover:bg-[#ef4444]/10"
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
              >
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Excluir documento" size="sm">
        <p className="text-sm text-[#a3a3a3]">
          O arquivo <strong className="text-[#f5f5f5]">{doc?.title}</strong> será excluído permanentemente do storage e não poderá ser recuperado.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={busy}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete} disabled={busy}>
            {busy ? 'Excluindo…' : 'Excluir'}
          </Button>
        </div>
      </Modal>
    </>
  )
}

function MetaRow({ label, value, dot }: { label: string; value: string; dot?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-[#737373] shrink-0">{label}</span>
      <span className="flex items-center gap-1.5 text-[#d4d4d4] text-right min-w-0">
        {dot && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dot }} />}
        <span className="truncate">{value}</span>
      </span>
    </div>
  )
}

// Icon components referenced but not imported — use inline
export function FileIcon({ ext }: { ext: string }) {
  const cfg = FILE_TYPE_CONFIG[ext]
  if (cfg?.isImage) return <Image className="h-4 w-4" style={{ color: cfg.color }} />
  return <File className="h-4 w-4" style={{ color: cfg?.color ?? '#737373' }} />
}
