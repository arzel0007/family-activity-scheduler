import { db, auth } from './firebase'
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore'
import { isSuperAdminEmail, type UserRole } from './admin'
import type { UserProfile } from './types'

function resolveRole(email: string | null, existingRole?: string): UserRole {
  if (isSuperAdminEmail(email)) return 'super_admin'
  if (existingRole === 'disabled') return 'disabled'
  if (existingRole === 'super_admin') return 'parent'
  return 'parent'
}

export async function ensureUserProfile(user: {
  uid: string
  email: string | null
  displayName?: string | null
  photoURL?: string | null
}) {
  if (!user.email) return

  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  const role = resolveRole(user.email, snap.data()?.role)

  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email.toLowerCase(),
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } else {
    await setDoc(
      ref,
      {
        email: user.email.toLowerCase(),
        role,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', userId))
  if (!snap.exists()) return null
  return snap.data() as UserProfile
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'displayName' | 'photoURL' | 'role'>>
) {
  await setDoc(
    doc(db, 'users', userId),
    { ...updates, updatedAt: serverTimestamp() },
    { merge: true }
  )
}

export async function findUserByEmail(email: string): Promise<{ id: string; data: UserProfile } | null> {
  const normalized = email.trim().toLowerCase()
  const snapshot = await getDocs(
    query(collection(db, 'users'), where('email', '==', normalized))
  )

  if (snapshot.empty) {
    const snapshotOriginal = await getDocs(
      query(collection(db, 'users'), where('email', '==', email.trim()))
    )
    if (snapshotOriginal.empty) return null
    const docSnap = snapshotOriginal.docs[0]
    return { id: docSnap.id, data: docSnap.data() as UserProfile }
  }

  const docSnap = snapshot.docs[0]
  return { id: docSnap.id, data: docSnap.data() as UserProfile }
}

export function getCurrentUserId() {
  return auth.currentUser?.uid ?? null
}

export async function isAccountDisabled(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId)
  return profile?.role === 'disabled'
}
