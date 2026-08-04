import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultCompanyData, loadCompanyData, loadFavorites, loadHistory, pushHistory, saveCompanyData, saveFavorites, toggleFavorite } from './storage'

beforeEach(() => {
  localStorage.clear()
})

describe('company data persistence', () => {
  it('returns defaults when nothing is stored (first launch)', () => {
    expect(loadCompanyData()).toEqual(defaultCompanyData)
  })

  it('round-trips saved company data', () => {
    const data = { ...defaultCompanyData, ruc: '20123456786', email: 'a@b.com' }
    saveCompanyData(data)
    expect(loadCompanyData()).toEqual(data)
  })

  it('fills missing fields with defaults when loading an older/partial schema', () => {
    localStorage.setItem('jungleFilms_data', JSON.stringify({ ruc: '20123456786' }))
    const loaded = loadCompanyData()
    expect(loaded.ruc).toBe('20123456786')
    expect(loaded.email).toBe('')
  })

  it('falls back to defaults on corrupted JSON', () => {
    localStorage.setItem('jungleFilms_data', '{not valid json')
    expect(loadCompanyData()).toEqual(defaultCompanyData)
  })

  it('falls back to defaults when the stored value is the literal null', () => {
    localStorage.setItem('jungleFilms_data', 'null')
    expect(loadCompanyData()).toEqual(defaultCompanyData)
  })

  it('does not throw when localStorage.setItem fails (quota/disabled)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => saveCompanyData(defaultCompanyData)).not.toThrow()
    spy.mockRestore()
  })
})

describe('favorites', () => {
  it('returns an empty array when nothing is stored', () => {
    expect(loadFavorites()).toEqual([])
  })

  it('adds a template id on first toggle', () => {
    const next = toggleFavorite('info-empresa')
    expect(next).toEqual(['info-empresa'])
    expect(loadFavorites()).toEqual(['info-empresa'])
  })

  it('removes a template id on second toggle', () => {
    toggleFavorite('info-empresa')
    const next = toggleFavorite('info-empresa')
    expect(next).toEqual([])
  })

  it('recovers to an empty list if corrupted (not an array)', () => {
    localStorage.setItem('jungleFilms_favorites', JSON.stringify({ oops: true }))
    expect(loadFavorites()).toEqual([])
  })

  it('saveFavorites persists the exact list given', () => {
    saveFavorites(['a', 'b', 'c'])
    expect(loadFavorites()).toEqual(['a', 'b', 'c'])
  })
})

describe('history', () => {
  it('returns an empty array when nothing is stored', () => {
    expect(loadHistory()).toEqual([])
  })

  it('recovers to an empty list if corrupted (not an array)', () => {
    localStorage.setItem('jungleFilms_history', JSON.stringify({ oops: true }))
    expect(loadHistory()).toEqual([])
  })

  it('prepends new entries (most recent first)', () => {
    pushHistory({ templateId: 'a', copiedAt: '1', renderedText: 'first' })
    const result = pushHistory({ templateId: 'b', copiedAt: '2', renderedText: 'second' })
    expect(result[0].templateId).toBe('b')
    expect(result[1].templateId).toBe('a')
  })

  it('caps history at 5 entries, evicting the oldest', () => {
    for (let i = 0; i < 6; i++) {
      pushHistory({ templateId: `t${i}`, copiedAt: String(i), renderedText: `text${i}` })
    }
    const history = loadHistory()
    expect(history).toHaveLength(5)
    expect(history[0].templateId).toBe('t5')
    expect(history.find((h) => h.templateId === 't0')).toBeUndefined()
  })
})
