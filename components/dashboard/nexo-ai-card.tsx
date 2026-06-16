'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ArrowRight } from 'lucide-react'

export function NexoAICard() {
  const router = useRouter()
  const [value, setValue] = useState('')

  const go = () => {
    const q = value.trim()
    router.push(q ? `/assistant?q=${encodeURIComponent(q)}` : '/assistant')
  }

  return (
    <div className="nexo-surface-accent nexo-rail-card nexo-fade-in rounded-xl p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#c9a227]/15 text-[#c9a227]">
          <Sparkles className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-semibold text-[#f5f5f5]">Nexo IA</h2>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-[#a3a3a3]">
        Pergunte algo ou peça para sua IA agir.
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); go() }}
        className="flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#0a0a0a] p-1 transition-colors focus-within:border-[#c9a227]/40"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ex: organize minha semana"
          className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm text-[#f5f5f5] placeholder:text-[#525252] focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Abrir assistente"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#c9a227] text-[#050505] transition-colors hover:bg-[#d6b43a]"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  )
}
