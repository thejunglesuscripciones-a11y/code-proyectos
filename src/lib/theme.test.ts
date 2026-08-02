import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  loadThemePreference,
  nextThemePreference,
  resolveIsDark,
  saveThemePreference,
  useTheme,
} from './theme'

function mockMatchMedia(matches: boolean) {
  const listeners: Array<() => void> = []
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
    addEventListener: (_: string, cb: () => void) => listeners.push(cb),
    removeEventListener: vi.fn(),
  }))
  return listeners
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  vi.unstubAllGlobals()
})

describe('loadThemePreference', () => {
  it('defaults to system when nothing is stored', () => {
    expect(loadThemePreference()).toBe('system')
  })

  it('reads a previously stored valid preference', () => {
    localStorage.setItem('jungleFilms_theme', 'dark')
    expect(loadThemePreference()).toBe('dark')
  })

  it('falls back to system for an invalid stored value', () => {
    localStorage.setItem('jungleFilms_theme', 'ultra-dark')
    expect(loadThemePreference()).toBe('system')
  })
})

describe('resolveIsDark', () => {
  it('is dark when preference is dark, regardless of system', () => {
    mockMatchMedia(false)
    expect(resolveIsDark('dark')).toBe(true)
  })

  it('is light when preference is light, regardless of system', () => {
    mockMatchMedia(true)
    expect(resolveIsDark('light')).toBe(false)
  })

  it('follows the system preference when set to system', () => {
    mockMatchMedia(true)
    expect(resolveIsDark('system')).toBe(true)
    mockMatchMedia(false)
    expect(resolveIsDark('system')).toBe(false)
  })
})

describe('nextThemePreference', () => {
  it('cycles system -> light -> dark -> system', () => {
    expect(nextThemePreference('system')).toBe('light')
    expect(nextThemePreference('light')).toBe('dark')
    expect(nextThemePreference('dark')).toBe('system')
  })
})

describe('saveThemePreference', () => {
  it('persists the preference and toggles the dark class', () => {
    mockMatchMedia(false)
    saveThemePreference('dark')
    expect(localStorage.getItem('jungleFilms_theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    saveThemePreference('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('does not throw when localStorage.setItem fails', () => {
    mockMatchMedia(false)
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(() => saveThemePreference('dark')).not.toThrow()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    spy.mockRestore()
  })
})

describe('useTheme', () => {
  it('applies the dark class on mount for a stored dark preference', () => {
    mockMatchMedia(false)
    localStorage.setItem('jungleFilms_theme', 'dark')
    renderHook(() => useTheme())
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('setTheme updates the class and persists the new preference', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useTheme())

    act(() => result.current[1]('dark'))

    expect(result.current[0]).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('jungleFilms_theme')).toBe('dark')
  })

  it('subscribes to system changes only while preference is system, and cleans up on unmount', () => {
    const listeners = mockMatchMedia(false)
    const removeEventListener = vi.fn()
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addEventListener: (_: string, cb: () => void) => listeners.push(cb),
      removeEventListener,
    }))

    const { unmount } = renderHook(() => useTheme())
    expect(listeners).toHaveLength(1)

    unmount()
    expect(removeEventListener).toHaveBeenCalled()
  })
})
