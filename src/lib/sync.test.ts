import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  getDocsMock,
  setDocMock,
  deleteDocMock,
  onSnapshotMock,
  docMock,
  collectionMock,
  queryMock,
  whereMock,
} = vi.hoisted(() => ({
  getDocsMock: vi.fn(),
  setDocMock: vi.fn(),
  deleteDocMock: vi.fn(),
  onSnapshotMock: vi.fn(),
  docMock: vi.fn((_db: unknown, collectionName: string, id: string) => ({ collectionName, id })),
  collectionMock: vi.fn((_db: unknown, name: string) => ({ name })),
  queryMock: vi.fn((ref: unknown, ...clauses: unknown[]) => ({ ref, clauses })),
  whereMock: vi.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
}))

vi.mock('firebase/firestore', () => ({
  getDocs: getDocsMock,
  setDoc: setDocMock,
  deleteDoc: deleteDocMock,
  onSnapshot: onSnapshotMock,
  doc: docMock,
  collection: collectionMock,
  query: queryMock,
  where: whereMock,
}))

vi.mock('./firebase', () => ({ db: {} }))

import {
  clearTemplateOverrideRemote,
  deleteClientRemote,
  deleteCollaboratorRemote,
  deleteCustomTemplateRemote,
  deletePersonRemote,
  deleteProjectRemote,
  fetchCollaboratorsOnce,
  fetchCustomTemplatesOnce,
  fetchTemplateOverridesOnce,
  saveCalendarEventRemote,
  saveClientRemote,
  saveCollaboratorRemote,
  saveCommentRemote,
  saveCustomTemplateRemote,
  savePersonRemote,
  saveProjectRemote,
  saveTemplateOverrideRemote,
  stampAttribution,
  subscribeCalendarEvents,
  subscribeClients,
  subscribeCollaborators,
  subscribeCustomTemplates,
  subscribeEventComments,
  subscribePeople,
  subscribeProjects,
  subscribeTemplateOverrides,
} from './sync'
import type { CalendarEvent, Client, Collaborator, EventComment, Person, Project, TemplateDefinition } from '../types'

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

const client: Client = {
  id: 'client-1',
  name: 'Adidas Perú',
  contactName: 'Renzo',
  contactEmail: 'renzo@adidas.com',
  contactPhone: '+51 987 654 321',
  notes: '',
}

describe('clients sync', () => {
  it('subscribeClients maps snapshot docs to clients', () => {
    onSnapshotMock.mockImplementation((_ref, cb) => {
      cb({ docs: [{ data: () => client }] })
      return () => {}
    })
    const callback = vi.fn()
    subscribeClients(callback)
    expect(collectionMock).toHaveBeenCalledWith({}, 'clients')
    expect(callback).toHaveBeenCalledWith([client])
  })

  it('saveClientRemote writes the client with the author attached', async () => {
    await saveClientRemote(client, author)
    expect(docMock).toHaveBeenCalledWith({}, 'clients', 'client-1')
    expect(setDocMock).toHaveBeenCalledWith({ collectionName: 'clients', id: 'client-1' }, { ...client, updatedBy: author })
  })

  it('deleteClientRemote deletes the matching doc', async () => {
    await deleteClientRemote('client-1')
    expect(deleteDocMock).toHaveBeenCalledWith({ collectionName: 'clients', id: 'client-1' })
  })
})

const project: Project = {
  id: 'project-1',
  clientId: 'client-1',
  name: 'Campaña Running',
  status: 'en_curso',
}

describe('projects sync', () => {
  it('subscribeProjects maps snapshot docs to projects', () => {
    onSnapshotMock.mockImplementation((_ref, cb) => {
      cb({ docs: [{ data: () => project }] })
      return () => {}
    })
    const callback = vi.fn()
    subscribeProjects(callback)
    expect(collectionMock).toHaveBeenCalledWith({}, 'projects')
    expect(callback).toHaveBeenCalledWith([project])
  })

  it('saveProjectRemote writes the project with the author attached', async () => {
    await saveProjectRemote(project, author)
    expect(docMock).toHaveBeenCalledWith({}, 'projects', 'project-1')
    expect(setDocMock).toHaveBeenCalledWith({ collectionName: 'projects', id: 'project-1' }, { ...project, updatedBy: author })
  })

  it('deleteProjectRemote deletes the matching doc', async () => {
    await deleteProjectRemote('project-1')
    expect(deleteDocMock).toHaveBeenCalledWith({ collectionName: 'projects', id: 'project-1' })
  })
})

const person: Person = {
  id: 'person-1',
  name: 'Diego Zúñiga',
  roleLabel: 'Camarógrafo',
  isExternal: false,
  contactInfo: '+51 999 111 222',
}

describe('people (Equipo) sync', () => {
  it('subscribePeople maps snapshot docs to people', () => {
    onSnapshotMock.mockImplementation((_ref, cb) => {
      cb({ docs: [{ data: () => person }] })
      return () => {}
    })
    const callback = vi.fn()
    subscribePeople(callback)
    expect(collectionMock).toHaveBeenCalledWith({}, 'people')
    expect(callback).toHaveBeenCalledWith([person])
  })

  it('savePersonRemote writes the person with the author attached', async () => {
    await savePersonRemote(person, author)
    expect(docMock).toHaveBeenCalledWith({}, 'people', 'person-1')
    expect(setDocMock).toHaveBeenCalledWith({ collectionName: 'people', id: 'person-1' }, { ...person, updatedBy: author })
  })

  it('deletePersonRemote deletes the matching doc', async () => {
    await deletePersonRemote('person-1')
    expect(deleteDocMock).toHaveBeenCalledWith({ collectionName: 'people', id: 'person-1' })
  })
})

const calendarEvent: CalendarEvent = {
  id: 'event-1',
  type: 'grabacion',
  title: 'Adidas — Campaña Running',
  clientId: 'client-1',
  projectId: 'project-1',
  startAt: '2026-08-04T09:00',
  endAt: '2026-08-04T13:00',
  locationText: 'Barranco',
  personIds: ['person-1'],
  notes: '',
  status: 'confirmado',
}

describe('calendar events sync', () => {
  it('subscribeCalendarEvents maps snapshot docs to events', () => {
    onSnapshotMock.mockImplementation((_ref, cb) => {
      cb({ docs: [{ data: () => calendarEvent }] })
      return () => {}
    })
    const callback = vi.fn()
    subscribeCalendarEvents(callback)
    expect(collectionMock).toHaveBeenCalledWith({}, 'events')
    expect(callback).toHaveBeenCalledWith([calendarEvent])
  })

  it('saveCalendarEventRemote writes the event with the author attached', async () => {
    await saveCalendarEventRemote(calendarEvent, author)
    expect(docMock).toHaveBeenCalledWith({}, 'events', 'event-1')
    expect(setDocMock).toHaveBeenCalledWith({ collectionName: 'events', id: 'event-1' }, { ...calendarEvent, updatedBy: author })
  })
})

const comment: EventComment = {
  id: 'comment-1',
  eventId: 'event-1',
  authorName: 'Antonio',
  authorEmail: 'antonio@gorilia.com',
  text: 'Confirmado con el cliente',
  createdAt: '2026-08-04T10:00:00.000Z',
}

describe('event comments sync', () => {
  it('subscribeEventComments queries by eventId, maps docs, and sorts by createdAt', () => {
    const older = { ...comment, id: 'comment-0', createdAt: '2026-08-04T09:00:00.000Z' }
    onSnapshotMock.mockImplementation((_ref, cb) => {
      cb({ docs: [{ data: () => comment }, { data: () => older }] })
      return () => {}
    })
    const callback = vi.fn()
    subscribeEventComments('event-1', callback)
    expect(whereMock).toHaveBeenCalledWith('eventId', '==', 'event-1')
    expect(callback).toHaveBeenCalledWith([older, comment])
  })

  it('saveCommentRemote writes the comment as-is (no attribution wrapper)', async () => {
    await saveCommentRemote(comment)
    expect(docMock).toHaveBeenCalledWith({}, 'comments', 'comment-1')
    expect(setDocMock).toHaveBeenCalledWith({ collectionName: 'comments', id: 'comment-1' }, comment)
  })
})
