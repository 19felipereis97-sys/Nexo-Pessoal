'use client'

import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { TASK_STATUSES, TASK_PRIORITIES, VIEWS, STATUS_LABEL, PRIORITY_LABEL, type ViewType, type SortBy } from './constants'

interface FilterState {
  search: string
  status: string[]
  priority: string[]
  projectId: string
  sortBy: SortBy
  sortDir: 'asc' | 'desc'
}

interface TaskFiltersProps {
  view: ViewType
  filters: FilterState
  projects: Array<{ id: string; name: string }>
  totalCount: number
  filteredCount: number
  onChange: (filters: FilterState) => void
  onViewChange: (view: ViewType) => void
  onAddTask: () => void
}

export function TaskFilters({
  view,
  filters,
  projects,
  totalCount,
  filteredCount,
  onChange,
  onViewChange,
  onAddTask,
}: TaskFiltersProps) {
  const hasActiveFilters =
    filters.search ||
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.projectId

  function toggleStatus(s: string) {
    onChange({
      ...filters,
      status: filters.status.includes(s)
        ? filters.status.filter((x) => x !== s)
        : [...filters.status, s],
    })
  }

  function togglePriority(p: string) {
    onChange({
      ...filters,
      priority: filters.priority.includes(p)
        ? filters.priority.filter((x) => x !== p)
        : [...filters.priority, p],
    })
  }

  function clearFilters() {
    onChange({ search: '', status: [], priority: [], projectId: '', sortBy: filters.sortBy, sortDir: filters.sortDir })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* View tabs + add button */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center rounded-lg border border-[#1f1f1f] bg-[#080808] p-0.5 gap-0.5">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onViewChange(v.id)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                view === v.id
                  ? 'bg-[#1a1a1a] text-[#f5f5f5] shadow-sm'
                  : 'text-[#525252] hover:text-[#a3a3a3]',
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {filteredCount !== totalCount && (
          <span className="text-xs text-[#525252]">{filteredCount} de {totalCount}</span>
        )}

        <Button variant="accent" size="sm" onClick={onAddTask}>
          + Nova tarefa
        </Button>
      </div>

      {/* Search + filters row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#525252]" />
          <input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Buscar tarefa..."
            className="w-full rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] pl-9 pr-3 py-2 text-sm text-[#f5f5f5] placeholder:text-[#333] focus:border-[#c9a227]/40 focus:outline-none transition-colors"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, search: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#525252] hover:text-[#a3a3a3]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status filter chips — only for kanban/lista views */}
        {(view === 'kanban' || view === 'lista') && (
          <div className="flex items-center gap-1 flex-wrap">
            {TASK_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatus(s)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-[10px] font-medium border transition-all',
                  filters.status.includes(s)
                    ? 'bg-[#c9a227]/10 border-[#c9a227]/30 text-[#c9a227]'
                    : 'bg-[#0d0d0d] border-[#1f1f1f] text-[#525252] hover:border-[#333] hover:text-[#a3a3a3]',
                )}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        )}

        {/* Priority filter */}
        <div className="flex items-center gap-1">
          {TASK_PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePriority(p)}
              className={cn(
                'rounded-full px-2.5 py-1 text-[10px] font-medium border transition-all',
                filters.priority.includes(p)
                  ? 'bg-[#c9a227]/10 border-[#c9a227]/30 text-[#c9a227]'
                  : 'bg-[#0d0d0d] border-[#1f1f1f] text-[#525252] hover:border-[#333] hover:text-[#a3a3a3]',
              )}
            >
              {PRIORITY_LABEL[p]}
            </button>
          ))}
        </div>

        {/* Project filter */}
        {projects.length > 0 && (
          <select
            value={filters.projectId}
            onChange={(e) => onChange({ ...filters, projectId: e.target.value })}
            className="rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-2.5 py-1.5 text-xs text-[#737373] focus:border-[#c9a227]/40 focus:outline-none cursor-pointer appearance-none"
          >
            <option value="">Todos os projetos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}

        {/* Sort */}
        <select
          value={`${filters.sortBy}:${filters.sortDir}`}
          onChange={(e) => {
            const [sortBy, sortDir] = e.target.value.split(':') as [SortBy, 'asc' | 'desc']
            onChange({ ...filters, sortBy, sortDir })
          }}
          className="rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-2.5 py-1.5 text-xs text-[#737373] focus:border-[#c9a227]/40 focus:outline-none cursor-pointer appearance-none"
        >
          <option value="created_at:desc">Mais recentes</option>
          <option value="created_at:asc">Mais antigas</option>
          <option value="due_date:asc">Vencimento ↑</option>
          <option value="due_date:desc">Vencimento ↓</option>
          <option value="priority:asc">Prioridade ↑</option>
          <option value="priority:desc">Prioridade ↓</option>
        </select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  )
}
