import { ArrowLeft, Plus } from 'lucide-react'
import type { Client } from '../types'
import { GlassPanel } from './GlassPanel'

interface ClientsPanelProps {
  clients: Client[]
  onSelect: (client: Client) => void
  onCreate: () => void
  onBack: () => void
}

export function ClientsPanel({ clients, onSelect, onCreate, onBack }: ClientsPanelProps) {
  return (
    <GlassPanel ariaLabel="Clientes">
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          aria-label="Volver"
          onClick={onBack}
          className="focus-ring tap-target flex items-center justify-center rounded-full text-text-secondary transition hover:bg-white/40 hover:text-text-primary"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold text-text-primary">Clientes</h2>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {clients.map((client) => (
          <button
            key={client.id}
            type="button"
            onClick={() => onSelect(client)}
            className="focus-ring glass-subtle flex w-full flex-col items-start rounded-xl px-3 py-2.5 text-left transition hover:brightness-110"
          >
            <span className="text-sm font-bold text-text-primary">{client.name}</span>
            {(client.contactName || client.contactPhone) && (
              <span className="text-xs text-text-secondary">{[client.contactName, client.contactPhone].filter(Boolean).join(' · ')}</span>
            )}
          </button>
        ))}

        {clients.length === 0 && <p className="text-center text-sm text-text-secondary">Aún no agregas clientes.</p>}
      </div>

      <button
        type="button"
        onClick={onCreate}
        className="focus-ring mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-jungle to-jungle-dark text-sm font-bold text-white shadow-md shadow-jungle/30 transition hover:brightness-105 active:scale-[0.98]"
      >
        <Plus size={16} /> Nuevo cliente
      </button>
    </GlassPanel>
  )
}
