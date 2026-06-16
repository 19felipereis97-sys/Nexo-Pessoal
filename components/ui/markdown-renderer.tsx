'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  if (!content?.trim()) return null

  return (
    <div className={cn('prose-nexo text-sm leading-relaxed text-[#d4d4d4]', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="mb-2 mt-4 text-base font-bold text-[#f5f5f5] first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-2 mt-3 text-sm font-semibold text-[#f5f5f5] first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-1 mt-2 text-xs font-semibold uppercase tracking-wide text-[#a3a3a3] first:mt-0">{children}</h3>,
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 ml-4 space-y-0.5 list-disc">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 ml-4 space-y-0.5 list-decimal">{children}</ol>,
          li: ({ children }) => <li className="text-sm leading-relaxed text-[#d4d4d4]">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-[#f5f5f5]">{children}</strong>,
          em: ({ children }) => <em className="italic text-[#a3a3a3]">{children}</em>,
          code: ({ children, className: cls }) => {
            const isBlock = cls?.includes('language-')
            if (isBlock) {
              return (
                <pre className="my-2 overflow-x-auto rounded-lg border border-[#262626] bg-[#0a0a0a] p-3">
                  <code className="text-xs text-[#a3a3a3] font-mono">{children}</code>
                </pre>
              )
            }
            return <code className="rounded px-1 py-0.5 text-xs bg-[#1a1a1a] border border-[#262626] text-[#c9a227] font-mono">{children}</code>
          },
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-[#c9a227]/40 pl-3 text-[#737373] italic">{children}</blockquote>
          ),
          a: ({ href, children }) => {
            // Reject javascript: and other dangerous protocols
            const safe = href && /^(https?:\/\/|mailto:|\/)/i.test(href) ? href : '#'
            return (
              <a href={safe} target="_blank" rel="noopener noreferrer" className="text-[#c9a227] underline underline-offset-2 hover:text-[#e0b83a]">{children}</a>
            )
          },
          hr: () => <hr className="my-3 border-[#262626]" />,
          input: ({ type, checked }) => {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mr-1.5 h-3.5 w-3.5 cursor-default accent-[#c9a227]"
                />
              )
            }
            return null
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
