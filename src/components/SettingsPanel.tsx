import { useState } from 'react'
import { X } from 'lucide-react'
import type { CompanyData } from '../types'
import { isValidEmail, isValidPhone, isValidRut } from '../lib/validators'

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
    <div
      role="dialog"
      aria-label="Configuración"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm"
    >
      <div className="w-[90%] max-w-md rounded-3xl border border-white/60 bg-white/70 p-4 shadow-2xl shadow-black/10 backdrop-blur-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Configuración</h2>
          <button
            aria-label="Cerrar"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-500 transition hover:bg-white/60 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {fields.map(({ key, label }) => (
            <label key={key} className="block text-xs text-gray-600">
              {label}
              <input
                type="text"
                value={draft[key]}
                onChange={(e) => updateField(key, e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/70 bg-white/70 px-2.5 py-1.5 text-sm outline-none ring-jungle/40 transition focus:ring-2"
              />
              {errors[key] && <span className="text-xs text-red-500">{errors[key]}</span>}
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="mt-4 w-full rounded-xl bg-gradient-to-br from-jungle to-jungle-dark px-3 py-2 text-sm font-bold text-white shadow-md shadow-jungle/30 transition hover:brightness-105 active:scale-[0.98]"
        >
          Guardar cambios
        </button>
      </div>
    </div>
  )
}
