import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { auth, googleProvider } from './firebase'

export type { User }

export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(auth, googleProvider)
}

export async function signOutUser(): Promise<void> {
  await signOut(auth)
}

/** Calls `callback` with the current user (or null) on every sign-in/sign-out. Returns an unsubscribe function. */
export function subscribeToAuthUser(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}
