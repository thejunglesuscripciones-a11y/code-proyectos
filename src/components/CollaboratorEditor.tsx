import { useState } from 'react'
import { Camera, Plus, Trash2, X } from 'lucide-react'
import type { Collaborator, CollaboratorContent, CollaboratorField } from '../types'
import { isValidDni, isValidPhone } from '../lib/validators'
import { generateFieldId } from '../lib/companyFields'
import { readImageAsCompressedDataUrl } from '../lib/collaborators'
import { GlassPanel } from './GlassPanel'

interface CollaboratorEditorProps {
  /** The collaborator being edited, or null when creating a new one. */
  collaborator: Collaborator | null
  /** Rejects if the save fails, so the editor can stay open and show an error instead of closing optimistically. */
  onSave: (content: CollaboratorContent) => Promise<void>
  onClose: () => void
}

type FieldErrors = Partial<Record<'name' | 'phone' | 'dni', string>>

const DEFAULT_FIELDS: CollaboratorField[] = [{ id: 'instagram', label: 'Instagram', value: '' }]

export function CollaboratorEditor({ collaborator, onSave, onClose }: CollaboratorEditorProps) {
  const [name, setName] = useState(collaborator?.name ?? '')
  const [role, setRole] = useState(collaborator?.role ?? '')
  const [phone, setPhone] = useState(collaborator?.phone ?? '')
  const [dni, setDni] = useState(collaborator?.dni ?? '')
  const [photo, setPhoto] = useState<string | null>(collaborator?.photo ?? null)
  const [customFields, setCustomFields] = useState<CollaboratorField[]>(collaborator?.customFields ?? DEFAULT_FIELDS)
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhoto(await readImageAsCompressedDataUrl(file))
  }

  function updateField(id: string, patch: Partial<Pick<CollaboratorField, 'label' | 'value'>>) {
    setCustomFields((prev) => prev.map((field) => (field.id === id ? { ...field, ...patch } : field)))
  }

  function removeField(id: string) {
    setCustomFields((prev) => prev.filter((field) => field.id !== id))
  }

  function addField() {
    const label = newFieldLabel.trim()
    if (!label) return
    const id = generateFieldId(
      label,
      customFields.map((f) => f.id),
    )
    setCustomFields((prev) => [...prev, { id, label, value: '' }])
    setNewFieldLabel('')
  }

  async function handleSave() {
    const trimmedName = name.trim()
    const nextErrors: FieldErrors = {}
    if (!trimmedName) nextErrors.name = 'El nombre es obligatorio'
    if (phone.trim() && !isValidPhone(phone)) nextErrors.phone = 'Teléfono inválido'
    if (dni.trim() && !isValidDni(dni)) nextErrors.dni = 'DNI inválido (8 dígitos)'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    setSaveError(null)
    try {
      await onSave({ name: trimmedName, role: role.trim(), phone: phone.trim(), dni: dni.trim(), photo, customFields })
    } catch {
      setSaveError('No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.')
      setSaving(false)
    }
  }

  return (
    <GlassPanel
      ariaLabel={collaborator ? `Editar ${collaborator.name}` : 'Nuevo colaborador'}
      widthClassName="w-[90%] max-w-md"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          {collaborator ? 'Editar colaborador' : 'Nuevo colaborador'}
        </h2>
        <button
          aria-label="Cerrar"
          onClick={onClose}
          className="focus-ring tap-target flex items-center justify-center rounded-full text-text-secondary transition hover:bg-white/40 hover:text-text-primary"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-3 overflow-y-auto">
        <div className="flex flex-col items-center gap-1.5">
          <label className="focus-ring relative flex h-[76px] w-[76px] cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border-glass bg-surface-secondary text-text-secondary">
            {photo ? (
              <img src={photo} alt="Foto del colaborador" className="h-full w-full object-cover" />
            ) : (
              <Camera size={24} />
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
          <span className="text-[11.5px] font-semibold text-text-secondary">Toca para agregar una foto</span>
        </div>

        <label className="block text-xs text-text-secondary">
          Nombre completo
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Renzo Quispe"
            className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
          />
          {errors.name && <span className="block text-xs text-[var(--color-error)]">{errors.name}</span>}
        </label>

        <label className="block text-xs text-text-secondary">
          Rol / a qué se dedica
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Ej: Camarógrafo freelance"
            className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
          />
        </label>

        <label className="block text-xs text-text-secondary">
          Teléfono
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+51 999 999 999"
            className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
          />
          {errors.phone && <span className="block text-xs text-[var(--color-error)]">{errors.phone}</span>}
        </label>

        <label className="block text-xs text-text-secondary">
          DNI
          <input
            type="text"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            placeholder="12345678"
            className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
          />
          {errors.dni && <span className="block text-xs text-[var(--color-error)]">{errors.dni}</span>}
        </label>

        <div className="border-t border-separator pt-3">
          <p className="mb-2 text-xs font-semibold text-text-tertiary">Otros datos (los defines tú)</p>
          <div className="space-y-2">
            {customFields.map((field) => (
              <div key={field.id} className="flex items-end gap-1.5">
                <label className="block flex-1 text-xs text-text-secondary">
                  Nombre
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
                  />
                </label>
                <label className="block flex-1 text-xs text-text-secondary">
                  Valor
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => updateField(field.id, { value: e.target.value })}
                    className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
                  />
                </label>
                <button
                  type="button"
                  aria-label={`Eliminar campo ${field.label}`}
                  onClick={() => removeField(field.id)}
                  className="focus-ring tap-target flex items-center justify-center rounded-xl text-[var(--color-error)] transition hover:bg-[var(--color-error)]/10"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-2 flex items-end gap-1.5">
            <label className="block flex-1 text-xs text-text-secondary">
              Nuevo campo
              <input
                type="text"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addField()
                  }
                }}
                placeholder="Ej: Banco"
                className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
              />
            </label>
            <button
              type="button"
              aria-label="Agregar campo"
              onClick={addField}
              className="focus-ring tap-target flex items-center justify-center rounded-xl bg-jungle/15 text-jungle-dark transition hover:bg-jungle/25"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      {saveError && <p className="mt-3 text-center text-xs text-[var(--color-error)]">{saveError}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="focus-ring mt-4 h-11 w-full rounded-xl bg-gradient-to-br from-jungle to-jungle-dark px-3 text-sm font-bold text-white shadow-md shadow-jungle/30 transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
      >
        {saving ? 'Guardando…' : 'Guardar'}
      </button>
    </GlassPanel>
  )
}
