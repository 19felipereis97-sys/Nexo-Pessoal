'use client'

import { useRef, useState } from 'react'
import { Bold, Code, Eye, FileText, Heading2, Italic, List, ListOrdered } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MarkdownRenderer } from './markdown-renderer'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  label?: string
  className?: string
}

type ToolbarAction = {
  icon: React.ElementType
  title: string
  prefix: string
  suffix?: string
  block?: boolean
}

const TOOLBAR: ToolbarAction[] = [
  { icon: Heading2, title: 'Título', prefix: '## ', block: true },
  { icon: Bold, title: 'Negrito', prefix: '**', suffix: '**' },
  { icon: Italic, title: 'Itálico', prefix: '_', suffix: '_' },
  { icon: List, title: 'Lista', prefix: '- ', block: true },
  { icon: ListOrdered, title: 'Lista numerada', prefix: '1. ', block: true },
  { icon: Code, title: 'Código', prefix: '`', suffix: '`' },
]

export function MarkdownEditor({ value, onChange, placeholder, rows = 10, label, className }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [preview, setPreview] = useState(false)

  function applyAction(action: ToolbarAction) {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = value.slice(start, end)
    const suffix = action.suffix ?? ''

    let newText: string
    let cursorOffset: number

    if (action.block) {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const before = value.slice(0, lineStart)
      const line = value.slice(lineStart, end || value.length)
      const after = value.slice(end || value.length)
      const already = line.startsWith(action.prefix)
      newText = before + (already ? line.slice(action.prefix.length) : action.prefix + line) + after
      cursorOffset = already ? -action.prefix.length : action.prefix.length
    } else {
      const before = value.slice(0, start)
      const after = value.slice(end)
      newText = before + action.prefix + selected + suffix + after
      cursorOffset = selected.length > 0 ? action.prefix.length + selected.length + suffix.length : action.prefix.length
    }

    onChange(newText)
    requestAnimationFrame(() => {
      ta.focus()
      const newPos = action.block
        ? start + cursorOffset
        : selected.length > 0
          ? start + action.prefix.length + selected.length
          : start + action.prefix.length
      ta.setSelectionRange(newPos, newPos)
    })
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-[#737373]">{label}</label>
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] transition-colors',
              preview
                ? 'bg-[#c9a227]/10 text-[#c9a227]'
                : 'text-[#525252] hover:text-[#a3a3a3]',
            )}
          >
            {preview ? <FileText className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {preview ? 'Editar' : 'Visualizar'}
          </button>
        </div>
      )}

      {!label && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            className={cn(
              'flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] transition-colors',
              preview ? 'bg-[#c9a227]/10 text-[#c9a227]' : 'text-[#525252] hover:text-[#a3a3a3]',
            )}
          >
            {preview ? <FileText className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {preview ? 'Editar' : 'Visualizar'}
          </button>
        </div>
      )}

      {/* Toolbar */}
      {!preview && (
        <div className="flex flex-wrap gap-0.5 rounded-t-lg border border-b-0 border-[#262626] bg-[#111111] px-1.5 py-1">
          {TOOLBAR.map((action) => (
            <button
              key={action.title}
              type="button"
              title={action.title}
              onMouseDown={(e) => { e.preventDefault(); applyAction(action) }}
              className="flex h-6 w-6 items-center justify-center rounded text-[#737373] transition-colors hover:bg-[#1a1a1a] hover:text-[#f5f5f5]"
            >
              <action.icon className="h-3.5 w-3.5" />
            </button>
          ))}
          <span className="ml-auto text-[10px] text-[#333] self-center pr-1">Markdown</span>
        </div>
      )}

      {preview ? (
        <div className={cn(
          'min-h-[120px] overflow-y-auto rounded-lg border border-[#262626] bg-[#0d0d0d] px-3 py-2.5',
          `min-h-[${rows * 24}px]`,
        )}>
          {value.trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-sm text-[#333]">{placeholder ?? 'Sem conteúdo.'}</p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full resize-none rounded-b-lg border border-[#262626] bg-[#0d0d0d] px-3 py-2.5 text-sm leading-relaxed text-[#f5f5f5] placeholder:text-[#333] focus:border-[#c9a227]/40 focus:outline-none transition-colors"
        />
      )}
    </div>
  )
}
