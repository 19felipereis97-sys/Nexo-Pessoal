'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, File, FileText, Grid3X3, HardDrive, Image, LayoutList, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { DocumentUploadModal } from './document-upload-modal'
import { DocumentDrawer } from './document-drawer'
import { DocumentEditModal } from './document-edit-modal'
import { FILE_TYPE_CONFIG, formatFileSize, getFileExt, DOCUMENT_CATEGORIES } from '@/lib/utils/documents'
import type { DocumentsData, DocumentWithRefs } from '@/lib/data/documents'

type View = 'card' | 'table'
type Sort = 'recent' | 'alpha' | 'size'
type StatusFilter = 'active' | 'archived' | 'all'

export function DocumentsClient({ data }: { data: DocumentsData }) {
  const router = useRouter()
  const { documents, projects, tasks, meetings, notes, totalSize, error } = data

  const [view, setView] = useState<View>('card')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [fileType, setFileType] = useState('')
  const [sort, setSort] = useState<Sort>('recent')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [showFilters, setShowFilters] = useState(false)

  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState<DocumentWithRefs | null>(null)
  const [editing, setEditing] = useState<DocumentWithRefs | null>(null)

  const refresh = () => router.refresh()

  const filtered = useMemo(() => {
    let list = documents
    if (statusFilter !== 'all') list = list.filter((d) => d.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (d) => d.title.toLowerCase().includes(q) ||
          d.file_name.toLowerCase().includes(q) ||
          d.category?.toLowerCase().includes(q) ||
          d.tags?.some((t) => t.toLowerCase().includes(q)),
      )
    }
    if (category) list = list.filter((d) => d.category === category)
    if (fileType) list = list.filter((d) => getFileExt(d.file_name) === fileType)
    if (sort === 'alpha') list = [...list].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
    else if (sort === 'size') list = [...list].sort((a, b) => (b.file_size ?? 0) - (a.file_size ?? 0))
    // 'recent' already sorted by uploaded_at desc from server
    return list
  }, [documents, search, category, fileType, sort, statusFilter])

  const counts = useMemo(() => {
    const active = documents.filter((d) => d.status === 'active')
    const archived = documents.filter((d) => d.status === 'archived')
    const pdfs = active.filter((d) => getFileExt(d.file_name) === 'pdf').length
    const images = active.filter((d) => {
      const cfg = FILE_TYPE_CONFIG[getFileExt(d.file_name)]
      return cfg?.isImage
    }).length
    return { total: active.length, archived: archived.length, pdfs, images }
  }, [documents])

  function onDeleted(id: string) {
    if (selected?.id === id) setSelected(null)
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1500px]">
        <PageHeader title="Documentos" description="Armazene e acesse seus arquivos" />
        <div className="flex h-48 items-center justify-center text-sm text-[#ef4444]">{error}</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader
        title="Documentos"
        description="Armazene e acesse seus arquivos com segurança"
        actions={
          <Button variant="accent" size="sm" onClick={() => setUploading(true)}>
            <Plus className="h-3.5 w-3.5" /> Upload
          </Button>
        }
      />

      {/* Metric cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard icon={<FileText className="h-4 w-4 text-[#c9a227]" />} label="Documentos" value={String(counts.total)} />
        <MetricCard icon={<HardDrive className="h-4 w-4 text-[#3b82f6]" />} label="Espaço usado" value={formatFileSize(totalSize)} />
        <MetricCard icon={<File className="h-4 w-4 text-[#ef4444]" />} label="PDFs" value={String(counts.pdfs)} />
        <MetricCard icon={<Image className="h-4 w-4 text-[#a855f7]" />} label="Imagens" value={String(counts.images)} />
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#525252]" />
          <Input
            className="pl-9"
            placeholder="Buscar documentos…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex rounded-lg border border-[#262626] bg-[#0d0d0d] p-0.5 gap-0.5">
          {(['active', 'archived', 'all'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1 text-xs transition-colors ${
                statusFilter === s ? 'bg-[#1a1a1a] text-[#f5f5f5]' : 'text-[#737373] hover:text-[#a3a3a3]'
              }`}
            >
              {s === 'active' ? 'Ativos' : s === 'archived' ? 'Arquivados' : 'Todos'}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowFilters((v) => !v)}
          className={showFilters ? 'text-[#c9a227]' : ''}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>

        {/* View toggle */}
        <div className="flex rounded-lg border border-[#262626] bg-[#0d0d0d] p-0.5 gap-0.5">
          <button
            onClick={() => setView('card')}
            className={`rounded-md p-1.5 transition-colors ${view === 'card' ? 'bg-[#1a1a1a] text-[#f5f5f5]' : 'text-[#737373]'}`}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setView('table')}
            className={`rounded-md p-1.5 transition-colors ${view === 'table' ? 'bg-[#1a1a1a] text-[#f5f5f5]' : 'text-[#737373]'}`}
          >
            <LayoutList className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-[#262626] bg-[#0d0d0d] p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#737373]">Categoria:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-[#262626] bg-[#111] px-2 py-1 text-xs text-[#f5f5f5] outline-none focus:border-[#c9a227]"
            >
              <option value="">Todas</option>
              {DOCUMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#737373]">Tipo:</span>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="rounded-lg border border-[#262626] bg-[#111] px-2 py-1 text-xs text-[#f5f5f5] outline-none focus:border-[#c9a227]"
            >
              <option value="">Todos</option>
              {Object.entries(FILE_TYPE_CONFIG).map(([ext, cfg]) => (
                <option key={ext} value={ext}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#737373]">Ordem:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-lg border border-[#262626] bg-[#111] px-2 py-1 text-xs text-[#f5f5f5] outline-none focus:border-[#c9a227]"
            >
              <option value="recent">Mais recente</option>
              <option value="alpha">A–Z</option>
              <option value="size">Maior tamanho</option>
            </select>
          </div>
          {(category || fileType || sort !== 'recent') && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-[#737373]"
              onClick={() => { setCategory(''); setFileType(''); setSort('recent') }}
            >
              <X className="h-3 w-3" /> Limpar
            </Button>
          )}
        </div>
      )}

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Archive className="h-5 w-5" />}
          title={search || category || fileType ? 'Nenhum resultado' : 'Nenhum documento'}
          description={search || category || fileType ? 'Tente outros filtros.' : 'Faça upload do seu primeiro documento para começar.'}
          action={!search && !category && !fileType ? { label: 'Upload', onClick: () => setUploading(true) } : undefined}
        />
      ) : view === 'card' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onClick={() => setSelected(doc)} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#262626]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f1f1f] bg-[#0d0d0d]">
                <th className="py-2.5 pl-4 pr-2 text-left text-xs font-medium text-[#737373]">Nome</th>
                <th className="px-2 py-2.5 text-left text-xs font-medium text-[#737373] hidden sm:table-cell">Tipo</th>
                <th className="px-2 py-2.5 text-left text-xs font-medium text-[#737373] hidden md:table-cell">Categoria</th>
                <th className="px-2 py-2.5 text-left text-xs font-medium text-[#737373] hidden md:table-cell">Tamanho</th>
                <th className="px-2 py-2.5 text-left text-xs font-medium text-[#737373] hidden lg:table-cell">Enviado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => {
                const ext = getFileExt(doc.file_name)
                const cfg = FILE_TYPE_CONFIG[ext] ?? { color: '#737373', label: ext.toUpperCase(), isImage: false, isPdf: false }
                return (
                  <tr
                    key={doc.id}
                    onClick={() => setSelected(doc)}
                    className="cursor-pointer border-b border-[#1a1a1a] hover:bg-[#0d0d0d] transition-colors"
                  >
                    <td className="py-3 pl-4 pr-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#262626] bg-[#111]">
                          <FileText className="h-3.5 w-3.5" style={{ color: cfg.color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-[#f5f5f5]">{doc.title}</p>
                          <p className="truncate text-xs text-[#525252]">{doc.file_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 hidden sm:table-cell">
                      <span className="text-xs font-mono" style={{ color: cfg.color }}>{cfg.label}</span>
                    </td>
                    <td className="px-2 py-3 hidden md:table-cell">
                      {doc.category ? <Badge variant="muted">{doc.category}</Badge> : <span className="text-xs text-[#525252]">—</span>}
                    </td>
                    <td className="px-2 py-3 text-xs text-[#737373] hidden md:table-cell">{formatFileSize(doc.file_size)}</td>
                    <td className="px-2 py-3 text-xs text-[#737373] hidden lg:table-cell">
                      {new Date(doc.uploaded_at).toLocaleDateString('pt-BR', { dateStyle: 'short' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals / Drawer */}
      <DocumentUploadModal
        key={uploading ? 'open' : 'closed'}
        open={uploading}
        onClose={() => setUploading(false)}
        onSaved={() => { setUploading(false); refresh() }}
        projects={projects}
        tasks={tasks}
        meetings={meetings}
        notes={notes}
      />

      <DocumentDrawer
        key={selected?.id ?? 'none'}
        document={selected}
        onClose={() => setSelected(null)}
        onEdit={(doc) => { setSelected(null); setEditing(doc) }}
        onDeleted={onDeleted}
      />

      <DocumentEditModal
        key={editing?.id ?? 'edit-none'}
        open={!!editing}
        document={editing}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); refresh() }}
        projects={projects}
        tasks={tasks}
        meetings={meetings}
        notes={notes}
      />
    </div>
  )
}

function DocumentCard({ doc, onClick }: { doc: DocumentWithRefs; onClick: () => void }) {
  const ext = getFileExt(doc.file_name)
  const cfg = FILE_TYPE_CONFIG[ext] ?? { color: '#737373', label: ext.toUpperCase(), isImage: false, isPdf: false }
  const uploadedAt = new Date(doc.uploaded_at).toLocaleDateString('pt-BR', { dateStyle: 'short' })

  return (
    <article
      onClick={onClick}
      className="nexo-hover flex cursor-pointer flex-col gap-3 rounded-xl border border-[#262626] bg-[#0d0d0d] p-4 hover:border-[#333] transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#262626] bg-[#111]">
          {cfg.isImage
            ? <Image className="h-4.5 w-4.5" style={{ color: cfg.color }} />
            : <FileText className="h-4.5 w-4.5" style={{ color: cfg.color }} />}
        </div>
        <span className="text-xs font-mono font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-[#f5f5f5]">{doc.title}</h3>
        {doc.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-[#737373]">{doc.description}</p>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-[#525252]">
        <span>{formatFileSize(doc.file_size)}</span>
        <span>{uploadedAt}</span>
      </div>

      {doc.category && (
        <div className="-mt-1">
          <Badge variant="muted">{doc.category}</Badge>
        </div>
      )}

      {doc.status === 'archived' && (
        <div className="flex items-center gap-1 text-xs text-[#c9a227]">
          <Archive className="h-3 w-3" /> Arquivado
        </div>
      )}
    </article>
  )
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#262626] bg-[#0d0d0d] p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#262626] bg-[#111]">
        {icon}
      </div>
      <div>
        <p className="text-xs text-[#737373]">{label}</p>
        <p className="text-lg font-semibold text-[#f5f5f5]">{value}</p>
      </div>
    </div>
  )
}
