import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getDocMock, setDocMock, deleteDocMock, onSnapshotMock, docMock, collectionMock, queryMock, orderByMock } =
  vi.hoisted(() => ({
    getDocMock: vi.fn(),
    setDocMock: vi.fn(),
    deleteDocMock: vi.fn(),
    onSnapshotMock: vi.fn(),
    docMock: vi.fn((_db: unknown, collectionName: string, id: string) => ({ collectionName, id })),
    collectionMock: vi.fn((_db: unknown, name: string) => ({ name })),
    queryMock: vi.fn((coll: unknown, ...constraints: unknown[]) => ({ coll, constraints })),
    orderByMock: vi.fn((field: string, direction: string) => ({ field, direction })),
  }))

vi.mock('firebase/firestore', () => ({
  getDoc: getDocMock,
  setDoc: setDocMock,
  deleteDoc: deleteDocMock,
  onSnapshot: onSnapshotMock,
  doc: docMock,
  collection: collectionMock,
  query: queryMock,
  orderBy: orderByMock,
}))

vi.mock('./firebase', () => ({ db: {} }))

import {
  addAuthorizedUser,
  isAuthorizedEmail,
  recordLogin,
  removeAuthorizedUser,
  subscribeAuthorizedUsers,
} from './authorizedUsers'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('isAuthorizedEmail', () => {
  it('returns true when the doc exists, normalizing the email to lowercase/trimmed', async () => {
    getDocMock.mockResolvedValue({ exists: () => true })
    const result = await isAuthorizedEmail('  Antonio@Gorilia.com  ')
    expect(docMock).toHaveBeenCalledWith({}, 'authorizedUsers', 'antonio@gorilia.com')
    expect(result).toBe(true)
  })

  it('returns false when the doc does not exist', async () => {
    getDocMock.mockResolvedValue({ exists: () => false })
    const result = await isAuthorizedEmail('nadie@ejemplo.com')
    expect(result).toBe(false)
  })
})

describe('subscribeAuthorizedUsers', () => {
  it('queries the collection ordered by addedAt and maps snapshot docs to AuthorizedUser objects', () => {
    const users = [{ email: 'a@b.com', name: 'A', photoURL: null, addedAt: '1', lastLoginAt: null }]
    onSnapshotMock.mockImplementation((_q, cb) => {
      cb({ docs: users.map((u) => ({ data: () => u })) })
      return () => {}
    })

    const callback = vi.fn()
    subscribeAuthorizedUsers(callback)

    expect(orderByMock).toHaveBeenCalledWith('addedAt', 'asc')
    expect(callback).toHaveBeenCalledWith(users)
  })

  it('returns the unsubscribe function from onSnapshot', () => {
    const unsubscribe = vi.fn()
    onSnapshotMock.mockReturnValue(unsubscribe)
    const result = subscribeAuthorizedUsers(vi.fn())
    expect(result).toBe(unsubscribe)
  })
})

describe('addAuthorizedUser', () => {
  it('creates a doc with the normalized email and blank profile fields', async () => {
    await addAuthorizedUser('  Nueva@Persona.com ')

    expect(docMock).toHaveBeenCalledWith({}, 'authorizedUsers', 'nueva@persona.com')
    expect(setDocMock).toHaveBeenCalledWith(
      { collectionName: 'authorizedUsers', id: 'nueva@persona.com' },
      expect.objectContaining({ email: 'nueva@persona.com', name: '', photoURL: null, lastLoginAt: null }),
    )
  })
})

describe('removeAuthorizedUser', () => {
  it('deletes the doc for the given email', async () => {
    await removeAuthorizedUser('antonio@gorilia.com')
    expect(deleteDocMock).toHaveBeenCalledWith({ collectionName: 'authorizedUsers', id: 'antonio@gorilia.com' })
  })
})

describe('recordLogin', () => {
  it('merges the name, photo and login time into the existing doc', async () => {
    await recordLogin({ email: 'antonio@gorilia.com', name: 'Antonio', photoURL: 'https://x/y.png' })

    expect(setDocMock).toHaveBeenCalledWith(
      { collectionName: 'authorizedUsers', id: 'antonio@gorilia.com' },
      expect.objectContaining({ name: 'Antonio', photoURL: 'https://x/y.png' }),
      { merge: true },
    )
  })
})
