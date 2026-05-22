import { db, auth } from './firebase'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

/**
 * Links two users as spouses (bidirectional relationship)
 */
export async function linkSpouse(currentUserId: string, spouseEmail: string) {
  if (!currentUserId) throw new Error('User not authenticated')

  const currentUser = auth.currentUser
  if (!currentUser) throw new Error('Not signed in')

  // Find the spouse user by email
  const usersRef = doc(db, 'users', currentUserId)
  const currentUserDoc = await getDoc(usersRef)

  if (!currentUserDoc.exists()) {
    throw new Error('Current user profile not found')
  }

  // Search for spouse by email in all users - in production, use Firestore query
  // For now, we'll need to implement a Cloud Function to find user by email securely
  const response = await fetch('/api/find-user-by-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: spouseEmail }),
  })

  if (!response.ok) {
    throw new Error('Spouse email not found')
  }

  const { userId: spouseUserId } = await response.json()

  if (spouseUserId === currentUserId) {
    throw new Error('You cannot be your own spouse')
  }

  // Update current user to add spouse
  await updateDoc(usersRef, {
    spouse: {
      id: spouseUserId,
      email: spouseEmail,
      linkedAt: serverTimestamp(),
    },
  })

  // Update spouse to add current user
  const spouseRef = doc(db, 'users', spouseUserId)
  await updateDoc(spouseRef, {
    spouse: {
      id: currentUserId,
      email: currentUser.email || '',
      linkedAt: serverTimestamp(),
    },
  })
}

/**
 * Unlinks two users as spouses
 */
export async function unlinkSpouse(currentUserId: string) {
  if (!currentUserId) throw new Error('User not authenticated')

  const currentUserRef = doc(db, 'users', currentUserId)
  const currentUserDoc = await getDoc(currentUserRef)

  if (!currentUserDoc.exists()) {
    throw new Error('Current user profile not found')
  }

  const spouse = currentUserDoc.data()?.spouse

  if (!spouse) {
    throw new Error('No spouse relationship found')
  }

  // Remove from current user
  await updateDoc(currentUserRef, {
    spouse: null,
  })

  // Remove from spouse
  const spouseRef = doc(db, 'users', spouse.id)
  await updateDoc(spouseRef, {
    spouse: null,
  })
}

/**
 * Checks if a user is the spouse of the current user
 */
export async function isSpouse(userId: string): Promise<boolean> {
  const currentUser = auth.currentUser
  if (!currentUser) return false

  const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid))
  if (!currentUserDoc.exists()) return false

  const spouse = currentUserDoc.data()?.spouse
  return spouse?.id === userId
}

/**
 * Gets the spouse user info for current user
 */
export async function getSpouse(
  userId: string
): Promise<{ id: string; email: string; linkedAt: any } | null> {
  const userDoc = await getDoc(doc(db, 'users', userId))
  if (!userDoc.exists()) return null

  return userDoc.data()?.spouse || null
}
