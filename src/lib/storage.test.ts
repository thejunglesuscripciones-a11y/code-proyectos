import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearTemplateOverride,
  defaultCompanyData,
  deleteCustomTemplate,
  loadCompanyData,
  loadCustomTemplates,
  loadFavorites,
  loadHistory,
  loadTemplateOverrides,
  pushHistory,
  saveCompanyData,
  saveFavorites,
  setTemplateOverride,
  toggleFavorite,
  upsertCustomTemplate,
} from './storage'
import type { TemplateDefinition } from '../types'

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

const customTemplate: TemplateDefinition = {
  id: 'custom-1',
  name: 'Mío',
  emoji: '📌',
  category: 'General',
  body: 'Hola',
  isCustom: true,
}

describe('custom templates', () => {
  it('returns an empty array when nothing is stored', () => {
    expect(loadCustomTemplates()).toEqual([])
  })

  it('upsertCustomTemplate inserts a new template', () => {
    const next = upsertCustomTemplate(customTemplate)
    expect(next).toEqual([customTemplate])
    expect(loadCustomTemplates()).toEqual([customTemplate])
  })

  it('upsertCustomTemplate replaces an existing template with the same id', () => {
    upsertCustomTemplate(customTemplate)
    const updated = { ...customTemplate, name: 'Renombrado' }
    const next = upsertCustomTemplate(updated)
    expect(next).toEqual([updated])
  })

  it('deleteCustomTemplate removes the matching template', () => {
    upsertCustomTemplate(customTemplate)
    const next = deleteCustomTemplate(customTemplate.id)
    expect(next).toEqual([])
    expect(loadCustomTemplates()).toEqual([])
  })

  it('recovers to an empty list if corrupted (not an array)', () => {
    localStorage.setItem('jungleFilms_customTemplates', JSON.stringify({ oops: true }))
    expect(loadCustomTemplates()).toEqual([])
  })
})

describe('template overrides', () => {
  const content = { name: 'Editado', emoji: '✏️', category: 'General', body: 'Nuevo cuerpo' }

  it('returns an empty object when nothing is stored', () => {
    expect(loadTemplateOverrides()).toEqual({})
  })

  it('setTemplateOverride stores content keyed by template id', () => {
    const next = setTemplateOverride('info-empresa', content)
    expect(next['info-empresa']).toEqual(content)
    expect(loadTemplateOverrides()['info-empresa']).toEqual(content)
  })

  it('clearTemplateOverride removes only the given id', () => {
    setTemplateOverride('info-empresa', content)
    setTemplateOverride('cotizacion', content)
    const next = clearTemplateOverride('info-empresa')
    expect(next['info-empresa']).toBeUndefined()
    expect(next['cotizacion']).toEqual(content)
  })

  it('recovers to an empty object if corrupted (an array instead of a map)', () => {
    localStorage.setItem('jungleFilms_templateOverrides', JSON.stringify(['oops']))
    expect(loadTemplateOverrides()).toEqual({})
  })
})
