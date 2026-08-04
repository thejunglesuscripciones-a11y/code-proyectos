import type { Attribution, Collaborator, CompanyData, TemplateContent, TemplateDefinition } from '../types'
import { loadCompanyData, loadFavorites, saveCompanyData, saveFavorites } from './storage'
import {
  fetchCollaboratorsOnce,
  fetchCustomTemplatesOnce,
  fetchTemplateOverridesOnce,
  saveCollaboratorRemote,
  saveCustomTemplateRemote,
  saveTemplateOverrideRemote,
} from './sync'

const BACKUP_VERSION = 2

export interface BackupData {
  version: number
  company: CompanyData
  favorites: string[]
  customTemplates: TemplateDefinition[]
  templateOverrides: Record<string, TemplateContent>
  collaborators: Collaborator[]
}

/** Company data/favorites are still per-device (localStorage); templates and collaborators are shared, so they're read live from Firestore. */
export async function createBackup(): Promise<BackupData> {
  const [customTemplates, templateOverrides, collaborators] = await Promise.all([
    fetchCustomTemplatesOnce(),
    fetchTemplateOverridesOnce(),
    fetchCollaboratorsOnce(),
  ])
  return {
    version: BACKUP_VERSION,
    company: loadCompanyData(),
    favorites: loadFavorites(),
    customTemplates,
    templateOverrides,
    collaborators,
  }
}

export function serializeBackup(backup: BackupData): string {
  return JSON.stringify(backup, null, 2)
}

export function backupFileName(): string {
  return `thejunglefilms-templates-respaldo-${new Date().toISOString().slice(0, 10)}.json`
}

/** Reads a File's contents as text. Uses FileReader (not the newer Blob.text()) for broader WebView compatibility. */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer el archivo.'))
    reader.readAsText(file)
  })
}

/** Triggers a browser download of the given text content as a file. */
export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function exportBackup(): Promise<void> {
  downloadTextFile(backupFileName(), serializeBackup(await createBackup()))
}

function isBackupData(value: unknown): value is BackupData {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.company === 'object' &&
    v.company !== null &&
    Array.isArray(v.favorites) &&
    Array.isArray(v.customTemplates) &&
    typeof v.templateOverrides === 'object' &&
    v.templateOverrides !== null
  )
}

/**
 * Parses a backup file's contents and restores it. Company data/favorites go back to this device's
 * localStorage; templates and collaborators are pushed to Firestore (attributed to `author`) so they
 * become the current shared state for everyone. Throws a user-facing message if the file isn't a
 * valid backup. `collaborators` defaults to [] so backups made before that field existed still import.
 */
export async function importBackup(raw: string, author: Attribution): Promise<BackupData> {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('El archivo no es un respaldo válido.')
  }
  if (!isBackupData(parsed)) {
    throw new Error('El archivo no es un respaldo válido.')
  }

  const collaborators = Array.isArray(parsed.collaborators) ? parsed.collaborators : []

  saveCompanyData(parsed.company)
  saveFavorites(parsed.favorites)
  await Promise.all([
    ...parsed.customTemplates.map((template) => saveCustomTemplateRemote(template, author)),
    ...Object.entries(parsed.templateOverrides).map(([templateId, content]) =>
      saveTemplateOverrideRemote(templateId, content, author),
    ),
    ...collaborators.map((collaborator) => saveCollaboratorRemote(collaborator, author)),
  ])

  return { ...parsed, collaborators }
}
