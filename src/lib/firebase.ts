import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

/**
 * Firebase's web config identifies the project — it is not a secret and is safe to commit.
 * Access control is enforced by Firestore security rules (see firestore.rules) and the
 * authorized-domains list in the Firebase console, not by hiding these values.
 */
const firebaseConfig = {
  apiKey: 'AIzaSyDwjIRn1uGq9z6OVF5EdkV_x3ndVIcff5g',
  authDomain: 'thejunglefilms-templates.firebaseapp.com',
  projectId: 'thejunglefilms-templates',
  storageBucket: 'thejunglefilms-templates.firebasestorage.app',
  messagingSenderId: '419088208713',
  appId: '1:419088208713:web:2f1d8be5c4d54a05c18098',
  measurementId: 'G-NYMJ98NCLP',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

/** Persistent local cache so the app keeps working offline with the last-synced data. */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})
