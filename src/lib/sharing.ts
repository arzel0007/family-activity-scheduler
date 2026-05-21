import { db, auth } from './firebase'
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { findUserByEmail } from './userProfile'
import type { Kid, KidSnapshot, Invitee } from './types'

export async function shareKidActivitiesWithParent(
  kid: Kid,
  parentEmail: string
): Promise<{ sharedCount: number; inviteeEmail: string }> {
  const currentUser = auth.currentUser
  if (!currentUser) throw new Error('Not signed in')

  const invitee = await findUserByEmail(parentEmail)
  if (!invitee) throw new Error('No parent found with that email. They need an account first.')
  if (invitee.id === currentUser.uid) throw new Error('You cannot share with yourself')

  const activitiesQuery = query(
    collection(db, 'activities'),
    where('userId', '==', currentUser.uid)
  )
  const snapshot = await getDocs(activitiesQuery)
  const kidActivities = snapshot.docs.filter((d) => {
    const kidIds = d.data().kidIds as string[] | undefined
    return kidIds?.includes(kid.id)
  })

  if (kidActivities.length === 0) {
    throw new Error(`No activities found for ${kid.name}`)
  }

  const inviteeEntry: Invitee = {
    userId: invitee.id,
    email: invitee.data.email || parentEmail.trim(),
    displayName: invitee.data.displayName,
    addedAt: new Date(),
  }

  const kidSnapshot: KidSnapshot = {
    id: kid.id,
    name: kid.name,
    photoURL: kid.photoURL,
  }

  const toUpdate = kidActivities.filter((activityDoc) => {
    const inviteeIds = (activityDoc.data().inviteeIds as string[] | undefined) || []
    return !inviteeIds.includes(invitee.id)
  })

  if (toUpdate.length === 0) {
    throw new Error(`${inviteeEntry.email} is already invited to all activities for ${kid.name}`)
  }

  await Promise.all(
    toUpdate.map((activityDoc) =>
      updateDoc(doc(db, 'activities', activityDoc.id), {
        inviteeIds: arrayUnion(invitee.id),
        invitees: arrayUnion(inviteeEntry),
        kidsOnActivity: arrayUnion(kidSnapshot),
      })
    )
  )

  await addDoc(collection(db, 'sharedKids'), {
    kidId: kid.id,
    kidName: kid.name,
    kidPhotoURL: kid.photoURL || '',
    ownerId: currentUser.uid,
    ownerEmail: currentUser.email || '',
    userId: invitee.id,
    inviteeEmail: inviteeEntry.email,
    sharedBy: currentUser.uid,
    createdAt: serverTimestamp(),
  })

  return { sharedCount: toUpdate.length, inviteeEmail: inviteeEntry.email }
}
