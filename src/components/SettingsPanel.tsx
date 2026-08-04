import { useState } from 'react'
import { Download, Plus, Trash2, Upload, X } from 'lucide-react'
import type { Attribution, CompanyData, CompanyField } from '../types'
import { isValidEmail, isValidPhone, isValidRuc } from '../lib/validators'
import { generateFieldId } from '../lib/companyFields'
import { exportBackup, importBackup, readFileAsText } from '../lib/backup'
import { GlassPanel } from './GlassPanel'

interface SettingsPanelProps {
  company: CompanyData
  author: Attribution
  onSave: (data: CompanyData) => void
  onClose: () => void
  onImported: () => void
}

type FixedField = 'ruc' | 'email' | 'phone'
type FieldErrors = Partial<Record<FixedField, string>>

const FIXED_FIELDS: { key: FixedField; label: string }[] = [
  { key: 'ruc', label: 'RUC' },
  { key: 'email', label: 'Email corporativo' },
  { key: 'phone', label: 'Teléfono WhatsApp' },
]

export function SettingsPanel({ company, author, onSave, onClose, onImported }: SettingsPanelProps) {
  const [draft, setDraft] = useState<CompanyData>(company)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [backupMessage, setBackupMessage] = useState<{ text: string; isError: boolean } | null>(null)
  const [exporting, setExporting] = useState(false)

  function validate(data: CompanyData): FieldErrors {
    const next: FieldErrors = {}
    if (data.ruc && !isValidRuc(data.ruc)) next.ruc = 'RUC inválido'
    if (data.email && !isValidEmail(data.email)) next.email = 'Email inválido'
    if (data.phone && !isValidPhone(data.phone)) next.phone = 'Teléfono inválido'
    return next
  }

  function handleSave() {
    const nextErrors = validate(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      onSave(draft)
      onClose()
    }
  }

  function updateFixedField(field: FixedField, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  function updateCustomField(id: string, patch: Partial<Pick<CompanyField, 'label' | 'value'>>) {
    setDraft((prev) => ({
      ...prev,
      customFields: prev.customFields.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    }))
  }

  function removeCustomField(id: string) {
    setDraft((prev) => ({ ...prev, customFields: prev.customFields.filter((field) => field.id !== id) }))
  }

  function addCustomField() {
    const label = newFieldLabel.trim()
    if (!label) return
    const id = generateFieldId(
      label,
      draft.customFields.map((field) => field.id),
    )
    setDraft((prev) => ({ ...prev, customFields: [...prev.customFields, { id, label, value: '' }] }))
    setNewFieldLabel('')
  }

  async function handleExport() {
    setExporting(true)
    try {
      await exportBackup()
    } finally {
      setExporting(false)
    }
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const backup = await importBackup(await readFileAsText(file), author)
      setDraft(backup.company)
      setBackupMessage({ text: 'Respaldo importado correctamente.', isError: false })
      onImported()
    } catch (err) {
      setBackupMessage({
        text: err instanceof Error ? err.message : 'No se pudo importar el respaldo.',
        isError: true,
      })
    }
  }

  return (
    <GlassPanel ariaLabel="Configuración" widthClassName="w-[90%] max-w-md">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Configuración</h2>
        <button
          aria-label="Cerrar"
          onClick={onClose}
          className="focus-ring tap-target flex items-center justify-center rounded-full text-text-secondary transition hover:bg-white/40 hover:text-text-primary"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-3 overflow-y-auto">
        {FIXED_FIELDS.map(({ key, label }) => (
          <label key={key} className="block text-xs text-text-secondary">
            {label}
            <input
              type="text"
              value={draft[key]}
              onChange={(e) => updateFixedField(key, e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
            />
            {errors[key] && <span className="text-xs text-[var(--color-error)]">{errors[key]}</span>}
          </label>
        ))}

        <div className="border-t border-separator pt-3">
          <p className="mb-2 text-xs font-semibold text-text-tertiary">Otros datos (los defines tú)</p>
          <div className="space-y-2">
            {draft.customFields.map((field) => (
              <div key={field.id} className="flex items-end gap-1.5">
                <label className="block flex-1 text-xs text-text-secondary">
                  Nombre
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateCustomField(field.id, { label: e.target.value })}
                    className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
                  />
                </label>
                <label className="block flex-1 text-xs text-text-secondary">
                  Valor
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => updateCustomField(field.id, { value: e.target.value })}
                    className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
                  />
                </label>
                <button
                  type="button"
                  aria-label={`Eliminar campo ${field.label}`}
                  onClick={() => removeCustomField(field.id)}
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
                    addCustomField()
                  }
                }}
                placeholder="Ej: Horario de Atención"
                className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
              />
            </label>
            <button
              type="button"
              aria-label="Agregar campo"
              onClick={addCustomField}
              className="focus-ring tap-target flex items-center justify-center rounded-xl bg-jungle/15 text-jungle-dark transition hover:bg-jungle/25"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="border-t border-separator pt-3">
          <p className="mb-2 text-xs font-semibold text-text-tertiary">Respaldo</p>
          <p className="mb-2 text-xs text-text-secondary">
            Guarda una copia de tus templates y datos, o restáurala en otro celular si pierdes este.
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="focus-ring flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-separator bg-surface-secondary text-xs font-semibold text-text-primary transition hover:bg-white/40 disabled:opacity-60"
            >
              <Download size={16} />
              {exporting ? 'Exportando…' : 'Exportar respaldo'}
            </button>
            <label className="focus-ring flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-separator bg-surface-secondary text-xs font-semibold text-text-primary transition hover:bg-white/40">
              <Upload size={16} />
              Importar respaldo
              <input type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
            </label>
          </div>
          {backupMessage && (
            <p
              className={`mt-2 text-xs ${backupMessage.isError ? 'text-[var(--color-error)]' : 'text-jungle-dark'}`}
            >
              {backupMessage.text}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="focus-ring mt-4 h-11 w-full rounded-xl bg-gradient-to-br from-jungle to-jungle-dark px-3 text-sm font-bold text-white shadow-md shadow-jungle/30 transition hover:brightness-105 active:scale-[0.98]"
      >
        Guardar cambios
      </button>
    </GlassPanel>
  )
}
