import type { Collaborator, CollaboratorContent } from '../types'

/** Up to 2 uppercase initials from a full name, used as the avatar fallback when there's no photo. */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

function generateCollaboratorId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `collab-${crypto.randomUUID()}`
  }
  return `collab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function createCollaboratorDraft(content: CollaboratorContent): Collaborator {
  return { id: generateCollaboratorId(), ...content }
}

/** Builds the plain-text block the "Copiar información" button copies: name, role, and every filled field. */
export function collaboratorCopyText(collaborator: Collaborator): string {
  const lines = [collaborator.name]
  if (collaborator.role) lines.push(collaborator.role)
  if (collaborator.phone) lines.push(`Teléfono: ${collaborator.phone}`)
  if (collaborator.dni) lines.push(`DNI: ${collaborator.dni}`)
  for (const field of collaborator.customFields) {
    if (field.value) lines.push(`${field.label}: ${field.value}`)
  }
  return lines.join('\n')
}

/** Reads an image File as a data URL, for the photo picker preview and storage. */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer la imagen.'))
    reader.readAsDataURL(file)
  })
}
