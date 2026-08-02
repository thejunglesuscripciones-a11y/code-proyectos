import { useState } from 'react'
import { X } from 'lucide-react'
import type { CompanyData } from '../types'
import { isValidEmail, isValidPhone, isValidRut } from '../lib/validators'
import { GlassPanel } from './GlassPanel'

interface SettingsPanelProps {
  company: CompanyData
  onSave: (data: CompanyData) => void
  onClose: () => void
}

type FieldErrors = Partial<Record<keyof CompanyData, string>>

export function SettingsPanel({ company, onSave, onClose }: SettingsPanelProps) {
  const [draft, setDraft] = useState<CompanyData>(company)
  const [errors, setErrors] = useState<FieldErrors>({})

  function validate(data: CompanyData): FieldErrors {
    const next: FieldErrors = {}
    if (data.rut && !isValidRut(data.rut)) next.rut = 'RUT inválido'
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

  function updateField(field: keyof CompanyData, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const fields: { key: keyof CompanyData; label: string }[] = [
    { key: 'rut', label: 'RUT' },
    { key: 'email', label: 'Email corporativo' },
    { key: 'phone', label: 'Teléfono WhatsApp' },
    { key: 'instagram', label: 'Instagram' },
    { key: 'website', label: 'Website' },
    { key: 'banco', label: 'Banco / Cuenta' },
    { key: 'contactos', label: 'Contactos' },
  ]

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
        {fields.map(({ key, label }) => (
          <label key={key} className="block text-xs text-text-secondary">
            {label}
            <input
              type="text"
              value={draft[key]}
              onChange={(e) => updateField(key, e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
            />
            {errors[key] && <span className="text-xs text-[var(--color-error)]">{errors[key]}</span>}
          </label>
        ))}
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
