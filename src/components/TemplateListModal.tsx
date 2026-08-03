import { useMemo, useState } from 'react'
import { Pencil, Plus, Search, Star } from 'lucide-react'
import type { TemplateDefinition } from '../types'
import { previewOf } from '../lib/templates'
import { GlassPanel } from './GlassPanel'
import { TabBar, type SectionTab } from './TabBar'

interface TemplateListModalProps {
  templates: TemplateDefinition[]
  favorites: string[]
  onSelect: (template: TemplateDefinition) => void
  onToggleFavorite: (templateId: string) => void
  onCreate: () => void
  onEdit: (template: TemplateDefinition) => void
  onTabChange: (tab: SectionTab) => void
}

export function TemplateListModal({
  templates,
  favorites,
  onSelect,
  onToggleFavorite,
  onCreate,
  onEdit,
  onTabChange,
}: TemplateListModalProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = q
      ? templates.filter(
          (t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q),
        )
      : templates

    return [...matches].sort((a, b) => {
      const aFav = favorites.includes(a.id) ? 0 : 1
      const bFav = favorites.includes(b.id) ? 0 : 1
      return aFav - bFav
    })
  }, [templates, favorites, query])

  return (
    <GlassPanel ariaLabel="Lista de templates">
      <TabBar active="templates" onChange={onTabChange} />
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Templates</h2>
        <button
          type="button"
          aria-label="Nuevo template"
          onClick={onCreate}
          className="focus-ring tap-target flex items-center justify-center rounded-full text-text-secondary transition hover:bg-white/40 hover:text-text-primary"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="glass-subtle mb-3 flex items-center gap-2 rounded-2xl px-3 py-2.5 shadow-inner">
        <Search size={16} className="text-text-tertiary" />
        <input
          type="text"
          placeholder="Buscar template..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-text-secondary">Sin resultados.</p>
        )}
        <ul>
          {filtered.map((template) => (
            <li key={template.id} className="mb-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelect(template)}
                className="focus-ring glass-subtle relative flex-1 overflow-hidden rounded-2xl p-3 text-left shadow-sm transition hover:brightness-110 hover:shadow-md"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent dark:from-white/5" />
                <p className="relative text-sm font-bold text-text-primary">
                  {template.emoji} {template.name}
                </p>
                <p className="relative text-xs text-text-secondary">{previewOf(template.body)}</p>
              </button>
              <button
                type="button"
                aria-label={`Editar ${template.name}`}
                onClick={() => onEdit(template)}
                className="focus-ring tap-target flex items-center justify-center rounded-full transition hover:bg-white/40"
              >
                <Pencil size={18} className="text-text-tertiary" />
              </button>
              <button
                type="button"
                aria-label={
                  favorites.includes(template.id)
                    ? `Quitar ${template.name} de favoritos`
                    : `Marcar ${template.name} como favorito`
                }
                onClick={() => onToggleFavorite(template.id)}
                className="focus-ring tap-target flex items-center justify-center rounded-full transition hover:bg-white/40"
              >
                <Star
                  size={20}
                  className={favorites.includes(template.id) ? 'fill-yellow-400 text-yellow-400' : 'text-text-tertiary'}
                />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </GlassPanel>
  )
}
