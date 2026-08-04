import { ArrowLeft, Plus } from 'lucide-react'
import type { Person } from '../types'
import { personInitials } from '../lib/people'
import { GlassPanel } from './GlassPanel'

interface TeamPanelProps {
  people: Person[]
  onSelect: (person: Person) => void
  onCreate: () => void
  onBack: () => void
}

export function TeamPanel({ people, onSelect, onCreate, onBack }: TeamPanelProps) {
  return (
    <GlassPanel ariaLabel="Equipo">
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          aria-label="Volver"
          onClick={onBack}
          className="focus-ring tap-target flex items-center justify-center rounded-full text-text-secondary transition hover:bg-white/40 hover:text-text-primary"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold text-text-primary">Equipo</h2>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {people.map((person) => (
          <button
            key={person.id}
            type="button"
            onClick={() => onSelect(person)}
            className="focus-ring glass-subtle flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition hover:brightness-110"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-jungle-light to-jungle text-xs font-bold text-white">
              {personInitials(person.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-text-primary">{person.name}</span>
              <span className="block truncate text-xs text-text-secondary">
                {[person.roleLabel, person.isExternal ? 'Externo' : null].filter(Boolean).join(' · ')}
              </span>
            </span>
          </button>
        ))}

        {people.length === 0 && <p className="text-center text-sm text-text-secondary">Aún no agregas a nadie del equipo.</p>}
      </div>

      <button
        type="button"
        onClick={onCreate}
        className="focus-ring mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-jungle to-jungle-dark text-sm font-bold text-white shadow-md shadow-jungle/30 transition hover:brightness-105 active:scale-[0.98]"
      >
        <Plus size={16} /> Agregar al equipo
      </button>
    </GlassPanel>
  )
}
