import { ArrowLeft, Plus } from 'lucide-react'
import type { Client, Project } from '../types'
import { PROJECT_STATUS_LABELS } from '../lib/projects'
import { GlassPanel } from './GlassPanel'

interface ProjectsPanelProps {
  projects: Project[]
  clients: Client[]
  onSelect: (project: Project) => void
  onCreate: () => void
  onBack: () => void
}

export function ProjectsPanel({ projects, clients, onSelect, onCreate, onBack }: ProjectsPanelProps) {
  function clientName(clientId: string | null) {
    return clients.find((c) => c.id === clientId)?.name
  }

  return (
    <GlassPanel ariaLabel="Proyectos">
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          aria-label="Volver"
          onClick={onBack}
          className="focus-ring tap-target flex items-center justify-center rounded-full text-text-secondary transition hover:bg-white/40 hover:text-text-primary"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold text-text-primary">Proyectos</h2>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => onSelect(project)}
            className="focus-ring glass-subtle flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition hover:brightness-110"
          >
            <span>
              <span className="block text-sm font-bold text-text-primary">{project.name}</span>
              {clientName(project.clientId) && <span className="text-xs text-text-secondary">{clientName(project.clientId)}</span>}
            </span>
            <span className="glass-subtle rounded-full px-2 py-1 text-[10px] font-semibold text-text-secondary">
              {PROJECT_STATUS_LABELS[project.status]}
            </span>
          </button>
        ))}

        {projects.length === 0 && <p className="text-center text-sm text-text-secondary">Aún no agregas proyectos.</p>}
      </div>

      <button
        type="button"
        onClick={onCreate}
        className="focus-ring mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-jungle to-jungle-dark text-sm font-bold text-white shadow-md shadow-jungle/30 transition hover:brightness-105 active:scale-[0.98]"
      >
        <Plus size={16} /> Nuevo proyecto
      </button>
    </GlassPanel>
  )
}
