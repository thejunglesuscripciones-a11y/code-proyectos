import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  backupFileName,
  createBackup,
  downloadTextFile,
  exportBackup,
  importBackup,
  readFileAsText,
  serializeBackup,
} from './backup'
import {
  defaultCompanyData,
  loadCollaborators,
  loadCompanyData,
  loadCustomTemplates,
  loadFavorites,
  loadTemplateOverrides,
} from './storage'
import type { Collaborator, TemplateDefinition } from '../types'

beforeEach(() => {
  localStorage.clear()
})

describe('createBackup / serializeBackup', () => {
  it('bundles the current company data, favorites, custom templates, overrides and collaborators', () => {
    const backup = createBackup()
    expect(backup).toEqual({
      version: 2,
      company: defaultCompanyData,
      favorites: [],
      customTemplates: [],
      templateOverrides: {},
      collaborators: [],
    })
  })

  it('serializes to valid, re-parseable JSON', () => {
    const json = serializeBackup(createBackup())
    expect(JSON.parse(json)).toEqual(createBackup())
  })
})

describe('backupFileName', () => {
  it('includes today\'s date in the filename', () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(backupFileName()).toBe(`thejunglefilms-templates-respaldo-${today}.json`)
  })
})

describe('downloadTextFile', () => {
  it('creates a download link with the given filename, clicks it, and removes it from the DOM', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const appendSpy = vi.spyOn(document.body, 'appendChild')

    downloadTextFile('archivo.json', '{"a":1}')

    const link = appendSpy.mock.calls[0][0] as HTMLAnchorElement
    expect(link.download).toBe('archivo.json')
    expect(link.href).toBe('blob:mock-url')
    expect(clickSpy).toHaveBeenCalled()
    expect(link.isConnected).toBe(false)

    clickSpy.mockRestore()
    appendSpy.mockRestore()
  })
})

describe('exportBackup', () => {
  it('triggers a download without throwing', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    expect(() => exportBackup()).not.toThrow()
    expect(clickSpy).toHaveBeenCalled()
    clickSpy.mockRestore()
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

describe('readFileAsText', () => {
  it('resolves with the file contents', async () => {
    const file = new File(['hola mundo'], 'x.json', { type: 'application/json' })
    await expect(readFileAsText(file)).resolves.toBe('hola mundo')
  })

  it('rejects when the FileReader reports an error', async () => {
    const readAsTextSpy = vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (this: FileReader) {
      this.onerror?.(new ProgressEvent('error') as unknown as ProgressEvent<FileReader>)
    })

    const file = new File(['hola'], 'x.json', { type: 'application/json' })
    await expect(readFileAsText(file)).rejects.toBeTruthy()

    readAsTextSpy.mockRestore()
  })
})

const collaborator: Collaborator = {
  id: 'collab-1',
  name: 'Antonio Ramírez',
  role: 'Director',
  phone: '+51 987 654 321',
  dni: '12345678',
  photo: null,
  customFields: [{ id: 'instagram', label: 'Instagram', value: '@antonio.jf' }],
}

describe('importBackup', () => {
  it('restores company data, favorites, custom templates, overrides and collaborators into storage', () => {
    const backup = {
      version: 2,
      company: { ...defaultCompanyData, ruc: '20123456786' },
      favorites: ['info-empresa'],
      customTemplates: [customTemplate],
      templateOverrides: { cotizacion: { name: 'Editado', emoji: '✏️', category: 'General', body: 'Cuerpo' } },
      collaborators: [collaborator],
    }

    const result = importBackup(JSON.stringify(backup))

    expect(result).toEqual(backup)
    expect(loadCompanyData().ruc).toBe('20123456786')
    expect(loadFavorites()).toEqual(['info-empresa'])
    expect(loadCustomTemplates()).toEqual([customTemplate])
    expect(loadTemplateOverrides()).toEqual(backup.templateOverrides)
    expect(loadCollaborators()).toEqual([collaborator])
  })

  it('defaults collaborators to an empty list when importing an older backup that lacks the field', () => {
    const backup = {
      version: 1,
      company: defaultCompanyData,
      favorites: [],
      customTemplates: [],
      templateOverrides: {},
    }

    const result = importBackup(JSON.stringify(backup))

    expect(result.collaborators).toEqual([])
    expect(loadCollaborators()).toEqual([])
  })

  it('throws a friendly error for invalid JSON', () => {
    expect(() => importBackup('{not valid json')).toThrow('El archivo no es un respaldo válido.')
  })

  it('throws a friendly error when required fields are missing', () => {
    expect(() => importBackup(JSON.stringify({ company: defaultCompanyData }))).toThrow(
      'El archivo no es un respaldo válido.',
    )
  })

  it('throws for a JSON file that is not an object (e.g. an array)', () => {
    expect(() => importBackup(JSON.stringify(['oops']))).toThrow('El archivo no es un respaldo válido.')
  })

  it('does not modify storage when the backup is invalid', () => {
    expect(() => importBackup('null')).toThrow()
    expect(loadCompanyData()).toEqual(defaultCompanyData)
  })
})
