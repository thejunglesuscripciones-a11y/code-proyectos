import { useState } from 'react'
import { Trash2, X } from 'lucide-react'
import type { Person, PersonContent } from '../types'
import { GlassPanel } from './GlassPanel'

interface TeamEditorProps {
  person: Person | null
  onSave: (content: PersonContent) => Promise<void>
  onDelete: () => void
  onClose: () => void
}

export function TeamEditor({ person, onSave, onDelete, onClose }: TeamEditorProps) {
  const [name, setName] = useState(person?.name ?? '')
  const [roleLabel, setRoleLabel] = useState(person?.roleLabel ?? '')
  const [isExternal, setIsExternal] = useState(person?.isExternal ?? false)
  const [contactInfo, setContactInfo] = useState(person?.contactInfo ?? '')
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
      await onSave({ name: trimmedName, roleLabel: roleLabel.trim(), isExternal, contactInfo: contactInfo.trim() })
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
      setSaving(false)
    }
  }

  return (
    <GlassPanel ariaLabel={person ? `Editar ${person.name}` : 'Agregar al equipo'} widthClassName="w-[90%] max-w-md">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">{person ? 'Editar persona' : 'Agregar al equipo'}</h2>
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
            placeholder="Ej: Diego Zúñiga"
            className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
          />
          {error && <span className="block text-xs text-[var(--color-error)]">{error}</span>}
        </label>
        <label className="block text-xs text-text-secondary">
          Rol
          <input
            type="text"
            value={roleLabel}
            onChange={(e) => setRoleLabel(e.target.value)}
            placeholder="Ej: Camarógrafo"
            className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
          />
        </label>
        <label className="block text-xs text-text-secondary">
          Teléfono o email
          <input
            type="text"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-text-secondary">
          <input type="checkbox" checked={isExternal} onChange={(e) => setIsExternal(e.target.checked)} className="h-4 w-4 rounded border-separator" />
          Es colaborador externo (no es socio)
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        {person && (
          <button
            type="button"
            onClick={onDelete}
            aria-label="Eliminar persona"
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
