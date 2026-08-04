import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  getDocsMock,
  setDocMock,
  deleteDocMock,
  onSnapshotMock,
  docMock,
  collectionMock,
} = vi.hoisted(() => ({
  getDocsMock: vi.fn(),
  setDocMock: vi.fn(),
  deleteDocMock: vi.fn(),
  onSnapshotMock: vi.fn(),
  docMock: vi.fn((_db: unknown, collectionName: string, id: string) => ({ collectionName, id })),
  collectionMock: vi.fn((_db: unknown, name: string) => ({ name })),
}))

vi.mock('firebase/firestore', () => ({
  getDocs: getDocsMock,
  setDoc: setDocMock,
  deleteDoc: deleteDocMock,
  onSnapshot: onSnapshotMock,
  doc: docMock,
  collection: collectionMock,
}))

vi.mock('./firebase', () => ({ db: {} }))

import {
  clearTemplateOverrideRemote,
  deleteCollaboratorRemote,
  deleteCustomTemplateRemote,
  fetchCollaboratorsOnce,
  fetchCustomTemplatesOnce,
  fetchTemplateOverridesOnce,
  saveCollaboratorRemote,
  saveCustomTemplateRemote,
  saveTemplateOverrideRemote,
  stampAttribution,
  subscribeCollaborators,
  subscribeCustomTemplates,
  subscribeTemplateOverrides,
} from './sync'
import type { Collaborator, TemplateDefinition } from '../types'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('stampAttribution', () => {
  it('builds an Attribution with the given email/name and the current time', () => {
    const before = new Date().toISOString()
    const attribution = stampAttribution('antonio@gorilia.com', 'Antonio')
    expect(attribution.email).toBe('antonio@gorilia.com')
    expect(attribution.name).toBe('Antonio')
    expect(attribution.updatedAt >= before).toBe(true)
  })
})

const template: TemplateDefinition = {
  id: 'custom-1',
  name: 'Mío',
  emoji: '📌',
  category: 'General',
  body: 'Hola',
  isCustom: true,
}

const author = { email: 'antonio@gorilia.com', name: 'Antonio', updatedAt: '2026-01-01T00:00:00.000Z' }

describe('custom templates sync', () => {
  it('subscribeCustomTemplates maps snapshot docs to templates', () => {
    onSnapshotMock.mockImplementation((_ref, cb) => {
      cb({ docs: [{ data: () => template }] })
      return () => {}
    })
    const callback = vi.fn()
    subscribeCustomTemplates(callback)
    expect(collectionMock).toHaveBeenCalledWith({}, 'templates')
    expect(callback).toHaveBeenCalledWith([template])
  })

  it('saveCustomTemplateRemote writes the template with the author attached', async () => {
    await saveCustomTemplateRemote(template, author)
    expect(docMock).toHaveBeenCalledWith({}, 'templates', 'custom-1')
    expect(setDocMock).toHaveBeenCalledWith(
      { collectionName: 'templates', id: 'custom-1' },
      { ...template, updatedBy: author },
    )
  })

  it('deleteCustomTemplateRemote deletes the matching doc', async () => {
    await deleteCustomTemplateRemote('custom-1')
    expect(deleteDocMock).toHaveBeenCalledWith({ collectionName: 'templates', id: 'custom-1' })
  })

  it('fetchCustomTemplatesOnce resolves with the current templates', async () => {
    getDocsMock.mockResolvedValue({ docs: [{ data: () => template }] })
    await expect(fetchCustomTemplatesOnce()).resolves.toEqual([template])
  })
})

describe('template overrides sync', () => {
  const content = { name: 'Editado', emoji: '✏️', category: 'General', body: 'Nuevo cuerpo' }

  it('subscribeTemplateOverrides maps snapshot docs to a map keyed by doc id', () => {
    onSnapshotMock.mockImplementation((_ref, cb) => {
      cb({ docs: [{ id: 'info-empresa', data: () => content }] })
      return () => {}
    })
    const callback = vi.fn()
    subscribeTemplateOverrides(callback)
    expect(collectionMock).toHaveBeenCalledWith({}, 'templateOverrides')
    expect(callback).toHaveBeenCalledWith({ 'info-empresa': content })
  })

  it('saveTemplateOverrideRemote writes the content keyed by template id with the author attached', async () => {
    await saveTemplateOverrideRemote('info-empresa', content, author)
    expect(docMock).toHaveBeenCalledWith({}, 'templateOverrides', 'info-empresa')
    expect(setDocMock).toHaveBeenCalledWith(
      { collectionName: 'templateOverrides', id: 'info-empresa' },
      { ...content, updatedBy: author },
    )
  })

  it('clearTemplateOverrideRemote deletes the matching doc', async () => {
    await clearTemplateOverrideRemote('info-empresa')
    expect(deleteDocMock).toHaveBeenCalledWith({ collectionName: 'templateOverrides', id: 'info-empresa' })
  })

  it('fetchTemplateOverridesOnce resolves with a map keyed by doc id', async () => {
    getDocsMock.mockResolvedValue({ docs: [{ id: 'info-empresa', data: () => content }] })
    await expect(fetchTemplateOverridesOnce()).resolves.toEqual({ 'info-empresa': content })
  })
})

const collaborator: Collaborator = {
  id: 'collab-1',
  name: 'Antonio Ramírez',
  role: 'Director',
  phone: '+51 987 654 321',
  dni: '12345678',
  photo: null,
  customFields: [],
}

describe('collaborators sync', () => {
  it('subscribeCollaborators maps snapshot docs to collaborators', () => {
    onSnapshotMock.mockImplementation((_ref, cb) => {
      cb({ docs: [{ data: () => collaborator }] })
      return () => {}
    })
    const callback = vi.fn()
    subscribeCollaborators(callback)
    expect(collectionMock).toHaveBeenCalledWith({}, 'collaborators')
    expect(callback).toHaveBeenCalledWith([collaborator])
  })

  it('saveCollaboratorRemote writes the collaborator with the author attached', async () => {
    await saveCollaboratorRemote(collaborator, author)
    expect(docMock).toHaveBeenCalledWith({}, 'collaborators', 'collab-1')
    expect(setDocMock).toHaveBeenCalledWith(
      { collectionName: 'collaborators', id: 'collab-1' },
      { ...collaborator, updatedBy: author },
    )
  })

  it('deleteCollaboratorRemote deletes the matching doc', async () => {
    await deleteCollaboratorRemote('collab-1')
    expect(deleteDocMock).toHaveBeenCalledWith({ collectionName: 'collaborators', id: 'collab-1' })
  })

  it('fetchCollaboratorsOnce resolves with the current collaborators', async () => {
    getDocsMock.mockResolvedValue({ docs: [{ data: () => collaborator }] })
    await expect(fetchCollaboratorsOnce()).resolves.toEqual([collaborator])
  })
})
