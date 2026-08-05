import { Plus } from 'lucide-react'
import type { Collaborator } from '../types'
import { initials } from '../lib/collaborators'
import { GlassPanel } from './GlassPanel'

interface CollaboratorsPanelProps {
  collaborators: Collaborator[]
  onSelect: (collaborator: Collaborator) => void
  onCreate: () => void
}

export function CollaboratorsPanel({ collaborators, onSelect, onCreate }: CollaboratorsPanelProps) {
  return (
    <GlassPanel ariaLabel="Colaboradores">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-text-primary">Colaboradores</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2.5">
          {collaborators.map((collaborator) => (
            <button
              key={collaborator.id}
              type="button"
              onClick={() => onSelect(collaborator)}
              className="focus-ring glass-subtle flex min-w-0 flex-col items-center gap-2 rounded-2xl p-3 text-center transition hover:brightness-110"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-jungle-light to-jungle text-base font-bold text-white">
                {collaborator.photo ? (
                  <img src={collaborator.photo} alt={collaborator.name} className="h-full w-full object-cover" />
                ) : (
                  initials(collaborator.name)
                )}
              </span>
              <span className="line-clamp-1 w-full break-words text-xs font-bold text-text-primary">{collaborator.name}</span>
              {collaborator.role && (
                <span
                  className="block w-full overflow-hidden whitespace-nowrap text-[11px] text-text-secondary"
                  style={{
                    maskImage: 'linear-gradient(to right, black 70%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to right, black 70%, transparent 100%)',
                  }}
                >
                  {collaborator.role}
                </span>
              )}
            </button>
          ))}

          <button
            type="button"
            aria-label="Agregar colaborador"
            onClick={onCreate}
            className="focus-ring flex min-h-[110px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border-glass text-text-secondary transition hover:text-text-primary"
          >
            <Plus size={20} />
            <span className="text-xs font-semibold">Agregar</span>
          </button>
        </div>

        {collaborators.length === 0 && (
          <p className="mt-3 text-center text-sm text-text-secondary">
            Aún no agregas a nadie. Toca &quot;Agregar&quot; para empezar.
          </p>
        )}
      </div>
    </GlassPanel>
  )
}
