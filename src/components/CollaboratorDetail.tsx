import { useState } from 'react'
import { ArrowLeft, Check, Copy, Pencil, Trash2 } from 'lucide-react'
import type { Collaborator } from '../types'
import { collaboratorCopyText, initials } from '../lib/collaborators'
import { copyToClipboard } from '../lib/clipboard'
import { GlassPanel } from './GlassPanel'

interface CollaboratorDetailProps {
  collaborator: Collaborator
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
}

const COPIED_FEEDBACK_MS = 2000

export function CollaboratorDetail({ collaborator, onBack, onEdit, onDelete }: CollaboratorDetailProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const ok = await copyToClipboard(collaboratorCopyText(collaborator))
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
    }
  }

  const filledCustomFields = collaborator.customFields.filter((field) => field.value)

  return (
    <GlassPanel ariaLabel={collaborator.name}>
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          aria-label="Volver"
          onClick={onBack}
          className="focus-ring tap-target flex items-center justify-center rounded-full text-text-secondary transition hover:bg-white/40 hover:text-text-primary"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold text-text-primary">Información rápida</h2>
      </div>

      <div className="mb-4 flex flex-col items-center gap-1.5">
        <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-jungle-light to-jungle text-2xl font-bold text-white">
          {collaborator.photo ? (
            <img src={collaborator.photo} alt={collaborator.name} className="h-full w-full object-cover" />
          ) : (
            initials(collaborator.name)
          )}
        </span>
        <p className="text-base font-bold text-text-primary">{collaborator.name}</p>
        {collaborator.role && <p className="text-xs text-text-secondary">{collaborator.role}</p>}
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="focus-ring mb-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-jungle to-jungle-dark text-sm font-bold text-white shadow-md shadow-jungle/30 transition hover:brightness-105 active:scale-[0.98]"
      >
        {copied ? (
          <>
            <Check size={16} /> ¡Copiado!
          </>
        ) : (
          <>
            <Copy size={16} /> Copiar información
          </>
        )}
      </button>

      <div className="flex-1 space-y-2 overflow-y-auto">
        <div className="glass-subtle rounded-xl px-3 py-2">
          <p className="text-[10px] font-semibold tracking-wide text-text-secondary">TELÉFONO</p>
          <p className="text-sm font-semibold text-text-primary">{collaborator.phone || '—'}</p>
        </div>
        <div className="glass-subtle rounded-xl px-3 py-2">
          <p className="text-[10px] font-semibold tracking-wide text-text-secondary">DNI</p>
          <p className="text-sm font-semibold text-text-primary">{collaborator.dni || '—'}</p>
        </div>
        {filledCustomFields.map((field) => (
          <div key={field.id} className="glass-subtle rounded-xl px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">{field.label}</p>
            <p className="text-sm font-semibold text-text-primary">{field.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="focus-ring glass-subtle flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold text-text-primary transition hover:brightness-110"
        >
          <Pencil size={16} /> Editar
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="focus-ring flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--color-error)]/10 text-sm font-semibold text-[var(--color-error)] transition hover:bg-[var(--color-error)]/20"
        >
          <Trash2 size={16} /> Eliminar
        </button>
      </div>
    </GlassPanel>
  )
}
