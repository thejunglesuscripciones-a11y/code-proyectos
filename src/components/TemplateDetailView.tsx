import { useMemo, useState } from 'react'
import { ArrowLeft, Check, Copy } from 'lucide-react'
import type { CompanyData, TemplateDefinition } from '../types'
import { copyToClipboard } from '../lib/clipboard'

interface TemplateDetailViewProps {
  template: TemplateDefinition
  company: CompanyData
  onBack: () => void
  onCopied: (renderedText: string) => void
}

const COPIED_FEEDBACK_MS = 2000

export function TemplateDetailView({ template, company, onBack, onCopied }: TemplateDetailViewProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)

  const renderedText = useMemo(
    () => template.render(values, company),
    [template, values, company],
  )

  async function handleCopy() {
    const ok = await copyToClipboard(renderedText)
    if (ok) {
      setCopied(true)
      onCopied(renderedText)
      setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
    }
  }

  return (
    <div role="dialog" aria-label={template.name} className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="flex max-h-[70vh] w-[90%] flex-col rounded-lg bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center gap-2">
          <button type="button" aria-label="Volver" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-base font-bold text-gray-900">
            {template.emoji} {template.name}
          </h2>
        </div>

        {editing && template.variables.length > 0 && (
          <div className="mb-3 space-y-2 rounded-lg border border-gray-200 p-3">
            {template.variables.map((variable) => (
              <label key={variable} className="block text-xs text-gray-600">
                {variable}
                <input
                  type="text"
                  value={values[variable] ?? ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [variable]: e.target.value }))}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                />
              </label>
            ))}
          </div>
        )}

        <pre
          data-testid="rendered-preview"
          className="mb-3 flex-1 overflow-y-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-3 font-mono text-xs text-gray-900"
        >
          {renderedText}
        </pre>

        <div className="flex gap-2">
          {template.variables.length > 0 && (
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              Editar
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-jungle px-3 py-2 text-sm font-bold text-white"
          >
            {copied ? (
              <>
                <Check size={16} /> ¡Copiado!
              </>
            ) : (
              <>
                <Copy size={16} /> Copiar al portapapeles
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
