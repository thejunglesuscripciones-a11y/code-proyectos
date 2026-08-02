import { useRef, useState } from 'react'
import { Copy, RotateCcw, Trash2 } from 'lucide-react'
import type { CompanyData, TemplateContent, TemplateDefinition } from '../types'
import { companyTokenList, extractVariables } from '../lib/templates'
import { GlassPanel } from './GlassPanel'

interface TemplateEditorProps {
  /** The template being edited, or null when creating a new one. */
  template: TemplateDefinition | null
  company: CompanyData
  /** Only meaningful for a built-in template: whether an override is currently stored for it. */
  canReset: boolean
  onSave: (content: TemplateContent) => void
  onDuplicate: () => void
  onDelete: () => void
  onReset: () => void
  onClose: () => void
}

type FieldErrors = Partial<Record<'name' | 'body', string>>

export function TemplateEditor({
  template,
  company,
  canReset,
  onSave,
  onDuplicate,
  onDelete,
  onReset,
  onClose,
}: TemplateEditorProps) {
  const [name, setName] = useState(template?.name ?? '')
  const [emoji, setEmoji] = useState(template?.emoji ?? '📄')
  const [category, setCategory] = useState(template?.category ?? '')
  const [body, setBody] = useState(template?.body ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const detectedVariables = extractVariables(body, company)

  function insertToken(token: string) {
    const textarea = bodyRef.current
    if (!textarea) {
      setBody((prev) => prev + token)
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const next = body.slice(0, start) + token + body.slice(end)
    setBody(next)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + token.length, start + token.length)
    })
  }

  function handleSave() {
    const trimmedName = name.trim()
    const trimmedBody = body.trim()
    const nextErrors: FieldErrors = {}
    if (!trimmedName) nextErrors.name = 'El nombre es obligatorio'
    if (!trimmedBody) nextErrors.body = 'El mensaje no puede estar vacío'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSave({ name: trimmedName, emoji: emoji.trim() || '📄', category: category.trim() || 'General', body })
  }

  return (
    <GlassPanel ariaLabel={template ? `Editar ${template.name}` : 'Nuevo template'} widthClassName="w-[90%] max-w-md">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">{template ? 'Editar template' : 'Nuevo template'}</h2>
        <button
          aria-label="Cerrar"
          onClick={onClose}
          className="focus-ring tap-target flex items-center justify-center rounded-full text-text-secondary transition hover:bg-white/40 hover:text-text-primary"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 overflow-y-auto">
        <div className="flex gap-2">
          <label className="block w-16 text-xs text-text-secondary">
            Emoji
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={4}
              className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-center text-lg outline-none transition focus:ring-2 focus:ring-focus"
            />
          </label>
          <label className="block flex-1 text-xs text-text-secondary">
            Nombre
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Aviso de vacaciones"
              className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
            />
          </label>
        </div>
        {errors.name && <p className="text-xs text-[var(--color-error)]">{errors.name}</p>}

        <label className="block text-xs text-text-secondary">
          Categoría
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ej: Comercial"
            className="mt-1 h-11 w-full rounded-xl border border-separator bg-surface-secondary px-2.5 text-sm text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
          />
        </label>

        <label className="block text-xs text-text-secondary">
          Mensaje — usa {'{variable}'} para los datos que llenarás cada vez
          <textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={7}
            placeholder={'Hola {cliente}, ...'}
            className="mt-1 w-full rounded-xl border border-separator bg-surface-secondary p-2.5 font-mono text-xs text-text-primary outline-none transition focus:ring-2 focus:ring-focus"
          />
        </label>
        {errors.body && <p className="text-xs text-[var(--color-error)]">{errors.body}</p>}

        <div>
          <p className="mb-1 text-xs text-text-tertiary">Insertar dato de la empresa:</p>
          <div className="flex flex-wrap gap-1.5">
            {companyTokenList(company).map(({ token, label }) => (
              <button
                key={token}
                type="button"
                title={`{${token}}`}
                onClick={() => insertToken(`{${token}}`)}
                className="focus-ring glass-subtle rounded-full px-2.5 py-1 text-xs text-text-secondary transition hover:brightness-110"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {detectedVariables.length > 0 && (
          <div>
            <p className="mb-1 text-xs text-text-tertiary">Se te pedirán antes de copiar:</p>
            <div className="flex flex-wrap gap-1.5">
              {detectedVariables.map((variable) => (
                <span
                  key={variable}
                  className="rounded-full border border-separator px-2.5 py-1 font-mono text-[11px] text-text-secondary"
                >
                  {`{${variable}}`}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {template && (
          <button
            type="button"
            aria-label="Duplicar template"
            onClick={onDuplicate}
            className="focus-ring glass-subtle tap-target flex items-center justify-center rounded-xl px-3 text-text-primary transition hover:brightness-110"
          >
            <Copy size={18} />
          </button>
        )}
        {canReset && (
          <button
            type="button"
            aria-label="Restaurar original"
            onClick={onReset}
            className="focus-ring glass-subtle tap-target flex items-center justify-center rounded-xl px-3 text-text-primary transition hover:brightness-110"
          >
            <RotateCcw size={18} />
          </button>
        )}
        {template?.isCustom && (
          <button
            type="button"
            aria-label="Eliminar template"
            onClick={onDelete}
            className="focus-ring tap-target flex items-center justify-center rounded-xl bg-[var(--color-error)]/10 px-3 text-[var(--color-error)] transition hover:bg-[var(--color-error)]/20"
          >
            <Trash2 size={18} />
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          className="focus-ring h-11 flex-1 rounded-xl bg-gradient-to-br from-jungle to-jungle-dark px-3 text-sm font-bold text-white shadow-md shadow-jungle/30 transition hover:brightness-105 active:scale-[0.98]"
        >
          Guardar
        </button>
      </div>
    </GlassPanel>
  )
}
