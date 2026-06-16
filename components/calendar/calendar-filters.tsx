'use client'

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { EVENT_TYPES, EVENT_TYPE_LABEL } from './constants'

interface CalendarFiltersProps {
  filterTypes: string[]
  filterProject: string
  projects: Array<{ id: string; name: string }>
  onChange: (types: string[], project: string) => void
}

export function CalendarFilters({ filterTypes, filterProject, projects, onChange }: CalendarFiltersProps) {
  const hasFilters = filterTypes.length > 0 || !!filterProject

  function toggleType(t: string) {
    if (filterTypes.includes(t)) {
      onChange(filterTypes.filter((x) => x !== t), filterProject)
    } else {
      onChange([...filterTypes, t], filterProject)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#333] mr-1">Filtrar:</span>

      {EVENT_TYPES.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => toggleType(t)}
          className={cn(
            'rounded-full px-2.5 py-1 text-[10px] font-medium border transition-all',
            filterTypes.includes(t)
              ? 'bg-[#c9a227]/10 border-[#c9a227]/30 text-[#c9a227]'
              : 'bg-[#0d0d0d] border-[#1f1f1f] text-[#525252] hover:border-[#262626] hover:text-[#a3a3a3]',
          )}
        >
          {EVENT_TYPE_LABEL[t]}
        </button>
      ))}

      {projects.length > 0 && (
        <select
          value={filterProject}
          onChange={(e) => onChange(filterTypes, e.target.value)}
          className="rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-2.5 py-1 text-[10px] text-[#525252] focus:border-[#c9a227]/40 focus:outline-none cursor-pointer appearance-none"
        >
          <option value="">Todos os projetos</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange([], '')}
          className="h-6 px-2 text-[10px]"
        >
          <X className="h-3 w-3" />
          Limpar
        </Button>
      )}
    </div>
  )
}
