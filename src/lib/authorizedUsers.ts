import { collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { AuthorizedUser } from '../types'

const COLLECTION = 'authorizedUsers'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function userDocRef(email: string) {
  return doc(db, COLLECTION, normalizeEmail(email))
}

export async function isAuthorizedEmail(email: string): Promise<boolean> {
  const snap = await getDoc(userDocRef(email))
  return snap.exists()
}

/** Subscribes to the live list of authorized users, ordered by when they were added. Returns an unsubscribe function. */
export function subscribeAuthorizedUsers(callback: (users: AuthorizedUser[]) => void): () => void {
  const q = query(collection(db, COLLECTION), orderBy('addedAt', 'asc'))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((docSnap) => docSnap.data() as AuthorizedUser))
  })
}

/** Pre-authorizes an email before that person has ever signed in; their name/photo fill in on first login. */
export async function addAuthorizedUser(email: string): Promise<void> {
  const cleanEmail = normalizeEmail(email)
  const user: AuthorizedUser = {
    email: cleanEmail,
    name: '',
    photoURL: null,
    addedAt: new Date().toISOString(),
    lastLoginAt: null,
  }
  await setDoc(userDocRef(cleanEmail), user)
}

export async function removeAuthorizedUser(email: string): Promise<void> {
  await deleteDoc(userDocRef(email))
}

/** Fills in the signed-in user's name/photo and login time on their existing authorized-user record. */
export async function recordLogin(user: { email: string; name: string; photoURL: string | null }): Promise<void> {
  await setDoc(
    userDocRef(user.email),
    { name: user.name, photoURL: user.photoURL, lastLoginAt: new Date().toISOString() },
    { merge: true },
  )
}
