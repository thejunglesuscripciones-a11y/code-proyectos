import { useEffect, useState } from 'react'

export type ThemePreference = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'jungleFilms_theme'
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

export function loadThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isThemePreference(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

function systemPrefersDark(): boolean {
  return window.matchMedia(DARK_MEDIA_QUERY).matches
}

export function resolveIsDark(preference: ThemePreference): boolean {
  return preference === 'dark' || (preference === 'system' && systemPrefersDark())
}

function applyTheme(preference: ThemePreference): void {
  document.documentElement.classList.toggle('dark', resolveIsDark(preference))
}

export function saveThemePreference(preference: ThemePreference): void {
  applyTheme(preference)
  try {
    localStorage.setItem(STORAGE_KEY, preference)
  } catch {
    // Persistence is best-effort; the in-memory class toggle above still applies for this session.
  }
}

const CYCLE: ThemePreference[] = ['system', 'light', 'dark']

export function nextThemePreference(current: ThemePreference): ThemePreference {
  return CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length]
}

/** Keeps the resolved theme in sync with the OS when the preference is "system". */
export function useTheme(): [ThemePreference, (next: ThemePreference) => void] {
  const [preference, setPreference] = useState<ThemePreference>(() => loadThemePreference())

  useEffect(() => {
    applyTheme(preference)
    if (preference !== 'system') return

    const media = window.matchMedia(DARK_MEDIA_QUERY)
    const handleChange = () => applyTheme(preference)
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [preference])

  function setTheme(next: ThemePreference) {
    saveThemePreference(next)
    setPreference(next)
  }

  return [preference, setTheme]
}
