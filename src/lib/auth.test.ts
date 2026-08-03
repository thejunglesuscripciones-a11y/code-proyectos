import { beforeEach, describe, expect, it, vi } from 'vitest'

const { onAuthStateChangedMock, signInWithPopupMock, signOutMock } = vi.hoisted(() => ({
  onAuthStateChangedMock: vi.fn(),
  signInWithPopupMock: vi.fn(),
  signOutMock: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: onAuthStateChangedMock,
  signInWithPopup: signInWithPopupMock,
  signOut: signOutMock,
}))

vi.mock('./firebase', () => ({ auth: { name: 'fake-auth' }, googleProvider: { name: 'fake-provider' } }))

import { signInWithGoogle, signOutUser, subscribeToAuthUser } from './auth'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('signInWithGoogle', () => {
  it('calls signInWithPopup with the auth instance and Google provider', async () => {
    signInWithPopupMock.mockResolvedValue(undefined)
    await signInWithGoogle()
    expect(signInWithPopupMock).toHaveBeenCalledWith({ name: 'fake-auth' }, { name: 'fake-provider' })
  })
})

describe('signOutUser', () => {
  it('calls signOut with the auth instance', async () => {
    signOutMock.mockResolvedValue(undefined)
    await signOutUser()
    expect(signOutMock).toHaveBeenCalledWith({ name: 'fake-auth' })
  })
})

describe('subscribeToAuthUser', () => {
  it('subscribes via onAuthStateChanged and forwards the callback', () => {
    const unsubscribe = vi.fn()
    onAuthStateChangedMock.mockReturnValue(unsubscribe)
    const callback = vi.fn()

    const result = subscribeToAuthUser(callback)

    expect(onAuthStateChangedMock).toHaveBeenCalledWith({ name: 'fake-auth' }, callback)
    expect(result).toBe(unsubscribe)
  })
})
