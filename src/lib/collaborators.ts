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

const MAX_PHOTO_DIMENSION = 640
const PHOTO_JPEG_QUALITY = 0.72
// Safety net in case the image never fires load/error (e.g. an unsupported format); falls
// back to the uncompressed data URL rather than hanging the photo picker forever.
const IMAGE_LOAD_TIMEOUT_MS = 1500

/**
 * Downscales and recompresses a data URL as JPEG so collaborator photos stay well under
 * Firestore's 1 MiB document limit — a full-resolution phone photo can exceed that on its
 * own, which made saves silently fail and the photo appear to "disappear" after sync.
 * Falls back to the original data URL if canvas isn't available or decoding fails.
 */
function compressImageDataUrl(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    let settled = false
    const finish = (result: string) => {
      if (settled) return
      settled = true
      resolve(result)
    }
    const timer = setTimeout(() => finish(dataUrl), IMAGE_LOAD_TIMEOUT_MS)
    const img = new Image()
    img.onload = () => {
      clearTimeout(timer)
      const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        finish(dataUrl)
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      finish(canvas.toDataURL('image/jpeg', PHOTO_JPEG_QUALITY))
    }
    img.onerror = () => {
      clearTimeout(timer)
      finish(dataUrl)
    }
    img.src = dataUrl
  })
}

/** Reads an image File and returns a compressed data URL ready to store — what the photo picker should use. */
export async function readImageAsCompressedDataUrl(file: File): Promise<string> {
  const raw = await readFileAsDataUrl(file)
  return compressImageDataUrl(raw)
}
