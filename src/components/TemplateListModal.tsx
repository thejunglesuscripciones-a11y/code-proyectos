import { useMemo, useState } from 'react'
import { Search, Star, X } from 'lucide-react'
import type { TemplateDefinition } from '../types'

interface TemplateListModalProps {
  templates: TemplateDefinition[]
  favorites: string[]
  onSelect: (template: TemplateDefinition) => void
  onToggleFavorite: (templateId: string) => void
  onClose: () => void
}

export function TemplateListModal({
  templates,
  favorites,
  onSelect,
  onToggleFavorite,
  onClose,
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
    <div
      role="dialog"
      aria-label="Lista de templates"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm"
    >
      <div className="flex max-h-[70vh] w-[90%] flex-col rounded-3xl border border-white/60 bg-white/70 p-4 shadow-2xl shadow-black/10 backdrop-blur-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Templates</h2>
          <button
            aria-label="Cerrar"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-500 transition hover:bg-white/60 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-3 flex items-center gap-2 rounded-2xl border border-white/60 bg-white/50 px-3 py-2.5 shadow-sm backdrop-blur-md">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Buscar template..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">Sin resultados.</p>
          )}
          <ul>
            {filtered.map((template) => (
              <li key={template.id} className="mb-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelect(template)}
                  className="flex-1 rounded-2xl border border-white/60 bg-white/40 p-3 text-left shadow-sm backdrop-blur-md transition hover:bg-white/70 hover:shadow-md"
                >
                  <p className="text-sm font-bold text-gray-900">
                    {template.emoji} {template.name}
                  </p>
                  <p className="text-xs text-gray-500">{template.preview}</p>
                </button>
                <button
                  type="button"
                  aria-label={
                    favorites.includes(template.id)
                      ? `Quitar ${template.name} de favoritos`
                      : `Marcar ${template.name} como favorito`
                  }
                  onClick={() => onToggleFavorite(template.id)}
                  className="rounded-full p-2 transition hover:bg-white/60"
                >
                  <Star
                    size={20}
                    className={favorites.includes(template.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
