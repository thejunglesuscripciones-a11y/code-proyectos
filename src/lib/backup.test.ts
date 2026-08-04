import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fetchCustomTemplatesOnceMock, fetchTemplateOverridesOnceMock, fetchCollaboratorsOnceMock, saveCustomTemplateRemoteMock, saveTemplateOverrideRemoteMock, saveCollaboratorRemoteMock } =
  vi.hoisted(() => ({
    fetchCustomTemplatesOnceMock: vi.fn().mockResolvedValue([]),
    fetchTemplateOverridesOnceMock: vi.fn().mockResolvedValue({}),
    fetchCollaboratorsOnceMock: vi.fn().mockResolvedValue([]),
    saveCustomTemplateRemoteMock: vi.fn().mockResolvedValue(undefined),
    saveTemplateOverrideRemoteMock: vi.fn().mockResolvedValue(undefined),
    saveCollaboratorRemoteMock: vi.fn().mockResolvedValue(undefined),
  }))

vi.mock('./sync', () => ({
  fetchCustomTemplatesOnce: fetchCustomTemplatesOnceMock,
  fetchTemplateOverridesOnce: fetchTemplateOverridesOnceMock,
  fetchCollaboratorsOnce: fetchCollaboratorsOnceMock,
  saveCustomTemplateRemote: saveCustomTemplateRemoteMock,
  saveTemplateOverrideRemote: saveTemplateOverrideRemoteMock,
  saveCollaboratorRemote: saveCollaboratorRemoteMock,
}))

import { backupFileName, createBackup, downloadTextFile, exportBackup, importBackup, readFileAsText, serializeBackup } from './backup'
import { defaultCompanyData, loadCompanyData, loadFavorites } from './storage'
import type { Attribution, Collaborator, TemplateDefinition } from '../types'

const author: Attribution = { name: 'Joaquín', email: 'joaquin.huamani.v@gmail.com', updatedAt: '2026-01-01T00:00:00.000Z' }

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  fetchCustomTemplatesOnceMock.mockResolvedValue([])
  fetchTemplateOverridesOnceMock.mockResolvedValue({})
  fetchCollaboratorsOnceMock.mockResolvedValue([])
})

describe('createBackup / serializeBackup', () => {
  it('bundles the current company data, favorites, and the templates/collaborators fetched from Firestore', async () => {
    const backup = await createBackup()
    expect(backup).toEqual({
      version: 2,
      company: defaultCompanyData,
      favorites: [],
      customTemplates: [],
      templateOverrides: {},
      collaborators: [],
    })
  })

  it('serializes to valid, re-parseable JSON', async () => {
    const json = serializeBackup(await createBackup())
    expect(JSON.parse(json)).toEqual(await createBackup())
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
  it('triggers a download without throwing', async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    await expect(exportBackup()).resolves.not.toThrow()
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
  it('restores company data/favorites locally and pushes templates/collaborators to Firestore, attributed to the author', async () => {
    const backup = {
      version: 2,
      company: { ...defaultCompanyData, ruc: '20123456786' },
      favorites: ['info-empresa'],
      customTemplates: [customTemplate],
      templateOverrides: { cotizacion: { name: 'Editado', emoji: '✏️', category: 'General', body: 'Cuerpo' } },
      collaborators: [collaborator],
    }

    const result = await importBackup(JSON.stringify(backup), author)

    expect(result).toEqual(backup)
    expect(loadCompanyData().ruc).toBe('20123456786')
    expect(loadFavorites()).toEqual(['info-empresa'])
    expect(saveCustomTemplateRemoteMock).toHaveBeenCalledWith(customTemplate, author)
    expect(saveTemplateOverrideRemoteMock).toHaveBeenCalledWith('cotizacion', backup.templateOverrides.cotizacion, author)
    expect(saveCollaboratorRemoteMock).toHaveBeenCalledWith(collaborator, author)
  })

  it('defaults collaborators to an empty list when importing an older backup that lacks the field', async () => {
    const backup = {
      version: 1,
      company: defaultCompanyData,
      favorites: [],
      customTemplates: [],
      templateOverrides: {},
    }

    const result = await importBackup(JSON.stringify(backup), author)

    expect(result.collaborators).toEqual([])
    expect(saveCollaboratorRemoteMock).not.toHaveBeenCalled()
  })

  it('throws a friendly error for invalid JSON', async () => {
    await expect(importBackup('{not valid json', author)).rejects.toThrow('El archivo no es un respaldo válido.')
  })

  it('throws a friendly error when required fields are missing', async () => {
    await expect(importBackup(JSON.stringify({ company: defaultCompanyData }), author)).rejects.toThrow(
      'El archivo no es un respaldo válido.',
    )
  })

  it('throws for a JSON file that is not an object (e.g. an array)', async () => {
    await expect(importBackup(JSON.stringify(['oops']), author)).rejects.toThrow('El archivo no es un respaldo válido.')
  })

  it('does not modify local storage when the backup is invalid', async () => {
    await expect(importBackup('null', author)).rejects.toThrow()
    expect(loadCompanyData()).toEqual(defaultCompanyData)
  })
})
