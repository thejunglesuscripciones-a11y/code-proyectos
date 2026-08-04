import type { CompanyData, HistoryEntry } from '../types'

const KEYS = {
  company: 'jungleFilms_data',
  favorites: 'jungleFilms_favorites',
  history: 'jungleFilms_history',
} as const

export const defaultCompanyData: CompanyData = {
  ruc: '',
  email: '',
  phone: '',
  customFields: [
    { id: 'instagram', label: 'Instagram', value: '' },
    { id: 'web', label: 'Website', value: '' },
    { id: 'banco', label: 'Banco / Cuenta', value: '' },
    { id: 'contactos', label: 'Contactos', value: '' },
  ],
}

const HISTORY_LIMIT = 5

/** Reads and JSON-parses a key, returning `fallback` on missing/corrupted data or a disabled localStorage. */
function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable (quota exceeded, private mode, disabled) — fail silently, in-memory state still works.
  }
}

export function loadCompanyData(): CompanyData {
  const stored = readJson<Partial<CompanyData>>(KEYS.company, {})
  return {
    ...defaultCompanyData,
    ...stored,
    customFields: Array.isArray(stored.customFields) ? stored.customFields : defaultCompanyData.customFields,
  }
}

export function saveCompanyData(data: CompanyData): void {
  writeJson(KEYS.company, data)
}

export function loadFavorites(): string[] {
  const value = readJson<string[]>(KEYS.favorites, [])
  return Array.isArray(value) ? value : []
}

export function saveFavorites(favorites: string[]): void {
  writeJson(KEYS.favorites, favorites)
}

export function toggleFavorite(templateId: string): string[] {
  const current = loadFavorites()
  const next = current.includes(templateId)
    ? current.filter((id) => id !== templateId)
    : [...current, templateId]
  saveFavorites(next)
  return next
}

export function loadHistory(): HistoryEntry[] {
  const value = readJson<HistoryEntry[]>(KEYS.history, [])
  return Array.isArray(value) ? value : []
}

/** Prepends a new entry and keeps only the most recent HISTORY_LIMIT items. */
export function pushHistory(entry: HistoryEntry): HistoryEntry[] {
  const current = loadHistory()
  const next = [entry, ...current].slice(0, HISTORY_LIMIT)
  writeJson(KEYS.history, next)
  return next
}
