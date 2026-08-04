import { useState } from 'react'
import { Trash2, X } from 'lucide-react'
import type { Client, Project, ProjectContent, ProjectStatus } from '../types'
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from '../lib/projects'
import { GlassPanel } from './GlassPanel'

interface ProjectEditorProps {
  project: Project | null
  clients: Client[]
  onSave: (content: ProjectContent) => Promise<void>
  onDelete: () => void
  onClose: () => void
}

export function ProjectEditor({ project, clients, onSave, onDelete, onClose }: ProjectEditorProps) {
  const [name, setName] = useState(project?.name ?? '')
  const [clientId, setClientId] = useState<string>(project?.clientId ?? '')
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'prospecto')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('El nombre es obligatorio')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave({ name: trimmedName, clientId: clientId || null, status })
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
      setSaving(false)
    }
  }

  return (
    <GlassPanel ariaLabel={project ? `Editar ${project.name}` : 'Nuevo proyecto'} widthClassName="w-[90%] max-w-md">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">{project ? 'Editar proyecto' : 'Nuevo proyecto'}</h2>
        <button
          aria-label="Cerrar"
          onClick={onClose}
          className="focus-ring tap-target flex items-center justify-center rounded-full text-text-secondary transition hover:bg-white/40 hover:text-text-primary"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-3 overflow-y-auto">
        <label className="block text-xs text-text-secondary">
          Nombre
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Adidas — Campaña Running"
            className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
          />
          {error && <span className="block text-xs text-[var(--color-error)]">{error}</span>}
        </label>

        <label className="block text-xs text-text-secondary">
          Cliente
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
          >
            <option value="">Sin cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <div>
          <p className="mb-1.5 text-xs text-text-secondary">Estado</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PROJECT_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`focus-ring rounded-xl py-2 text-xs font-semibold transition ${
                  status === s ? 'bg-gradient-to-br from-jungle to-jungle-dark text-white shadow-md shadow-jungle/30' : 'glass-subtle text-text-secondary'
                }`}
              >
                {PROJECT_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {project && (
          <button
            type="button"
            onClick={onDelete}
            aria-label="Eliminar proyecto"
            className="focus-ring flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[var(--color-error)]/10 px-4 text-sm font-semibold text-[var(--color-error)] transition hover:bg-[var(--color-error)]/20"
          >
            <Trash2 size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="focus-ring h-11 flex-1 rounded-xl bg-gradient-to-br from-jungle to-jungle-dark text-sm font-bold text-white shadow-md shadow-jungle/30 transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </GlassPanel>
  )
}
