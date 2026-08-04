import { useState } from 'react'
import { Trash2, X } from 'lucide-react'
import type { Client, ClientContent } from '../types'
import { GlassPanel } from './GlassPanel'

interface ClientEditorProps {
  client: Client | null
  onSave: (content: ClientContent) => Promise<void>
  onDelete: () => void
  onClose: () => void
}

export function ClientEditor({ client, onSave, onDelete, onClose }: ClientEditorProps) {
  const [name, setName] = useState(client?.name ?? '')
  const [contactName, setContactName] = useState(client?.contactName ?? '')
  const [contactEmail, setContactEmail] = useState(client?.contactEmail ?? '')
  const [contactPhone, setContactPhone] = useState(client?.contactPhone ?? '')
  const [notes, setNotes] = useState(client?.notes ?? '')
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
      await onSave({
        name: trimmedName,
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        notes: notes.trim(),
      })
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
      setSaving(false)
    }
  }

  return (
    <GlassPanel ariaLabel={client ? `Editar ${client.name}` : 'Nuevo cliente'} widthClassName="w-[90%] max-w-md">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">{client ? 'Editar cliente' : 'Nuevo cliente'}</h2>
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
            placeholder="Ej: Adidas Perú"
            className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
          />
          {error && <span className="block text-xs text-[var(--color-error)]">{error}</span>}
        </label>
        <label className="block text-xs text-text-secondary">
          Persona de contacto
          <input
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs text-text-secondary">
            Teléfono
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
            />
          </label>
          <label className="block text-xs text-text-secondary">
            Email
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
            />
          </label>
        </div>
        <label className="block text-xs text-text-secondary">
          Notas
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full resize-none rounded-xl border border-separator bg-surface-secondary px-2.5 py-2 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
          />
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        {client && (
          <button
            type="button"
            onClick={onDelete}
            aria-label="Eliminar cliente"
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
