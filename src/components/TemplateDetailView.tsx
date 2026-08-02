import { useMemo, useState } from 'react'
import { ArrowLeft, Check, Copy } from 'lucide-react'
import type { CompanyData, TemplateDefinition } from '../types'
import { copyToClipboard } from '../lib/clipboard'
import { GlassPanel } from './GlassPanel'

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
    <GlassPanel ariaLabel={template.name}>
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          aria-label="Volver"
          onClick={onBack}
          className="rounded-full p-1.5 text-gray-600 transition hover:bg-white/40 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-base font-bold text-gray-900">
          {template.emoji} {template.name}
        </h2>
      </div>

      {editing && template.variables.length > 0 && (
        <div className="mb-3 space-y-2 rounded-2xl border border-white/50 bg-white/15 p-3 backdrop-blur-md">
          {template.variables.map((variable) => (
            <label key={variable} className="block text-xs text-gray-600">
              {variable}
              <input
                type="text"
                value={values[variable] ?? ''}
                onChange={(e) => setValues((prev) => ({ ...prev, [variable]: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/60 bg-white/50 px-2.5 py-1.5 text-sm text-gray-900 outline-none ring-jungle/40 transition focus:ring-2"
              />
            </label>
          ))}
        </div>
      )}

      <pre
        data-testid="rendered-preview"
        className="mb-3 flex-1 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-white/40 bg-white/15 p-3 font-mono text-xs text-gray-900 backdrop-blur-md"
      >
        {renderedText}
      </pre>

      <div className="flex gap-2">
        {template.variables.length > 0 && (
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="rounded-xl border border-white/50 bg-white/20 px-3 py-2 text-sm font-medium text-gray-700 backdrop-blur-md transition hover:bg-white/40"
          >
            Editar
          </button>
        )}
        <button
          type="button"
          onClick={handleCopy}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-jungle to-jungle-dark px-3 py-2 text-sm font-bold text-white shadow-md shadow-jungle/30 transition hover:brightness-105 active:scale-[0.98]"
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
    </GlassPanel>
  )
}
