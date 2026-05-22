import { db, auth } from './firebase'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { findUserByEmail } from './userProfile'
import { isSpouse } from './spouse'
import type { Invitee } from './types'

/**
 * Share a kid only with spouse
 */
export async function shareKidWithSpouse(kidId: string, spouseEmail: string) {
  const currentUser = auth.currentUser
  if (!currentUser) throw new Error('Not signed in')

  const invitee = await findUserByEmail(spouseEmail)
  if (!invitee) throw new Error('No spouse found with that email. They need an account first.')
  if (invitee.id === currentUser.uid) throw new Error('You cannot share with yourself')

  // Verify that the invitee is the spouse
  const isSpouseUser = await isSpouse(invitee.id)
  if (!isSpouseUser) {
    throw new Error('This parent is not your linked spouse. Link your spouse first.')
  }

  // Share the kid document
  const kidRef = doc(db, 'kids', kidId)
  const inviteeEntry: Invitee = {
    userId: invitee.id,
    email: spouseEmail.trim(),
    displayName: invitee.data.displayName,
    addedAt: new Date(),
  }

  await updateDoc(kidRef, {
    inviteeIds: arrayUnion(invitee.id),
    invitees: arrayUnion(inviteeEntry),
  })
}

/**
 * Share an activity only with spouse
 */
export async function shareActivityWithSpouse(activityId: string, spouseEmail: string) {
  const currentUser = auth.currentUser
  if (!currentUser) throw new Error('Not signed in')

  const invitee = await findUserByEmail(spouseEmail)
  if (!invitee) throw new Error('No spouse found with that email.')
  if (invitee.id === currentUser.uid) throw new Error('You cannot share with yourself')

  // Verify that the invitee is the spouse
  const isSpouseUser = await isSpouse(invitee.id)
  if (!isSpouseUser) {
    throw new Error('This parent is not your linked spouse.')
  }

  // Share the activity
  const activityRef = doc(db, 'activities', activityId)
  const inviteeEntry: Invitee = {
    userId: invitee.id,
    email: spouseEmail.trim(),
    displayName: invitee.data.displayName,
    addedAt: new Date(),
  }

  await updateDoc(activityRef, {
    inviteeIds: arrayUnion(invitee.id),
    invitees: arrayUnion(inviteeEntry),
  })
}
