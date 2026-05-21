import { db, auth } from './firebase'
import { collection, addDoc, Timestamp } from 'firebase/firestore'

export async function bulkAssignActivity(
  title: string,
  description: string,
  dueDate: string,
  dueTime: string,
  kidIds: string[],
  tagIds: string[]
) {
  if (!auth.currentUser || kidIds.length === 0) return

  try {
    for (const kidId of kidIds) {
      await addDoc(collection(db, 'activities'), {
        title,
        description,
        dueDate,
        dueTime,
        kidIds: [kidId],
        tagIds,
        userId: auth.currentUser.uid,
        createdAt: Timestamp.now(),
        archived: false
      })
    }
  } catch (error) {
    console.error('Failed to bulk assign activities:', error)
  }
}

export async function bulkUpdateActivities(
  activityIds: string[],
  updates: Record<string, any>
) {
  if (!auth.currentUser) return

  try {
    const { updateDoc, doc } = await import('firebase/firestore')
    for (const activityId of activityIds) {
      await updateDoc(doc(db, 'activities', activityId), updates)
    }
  } catch (error) {
    console.error('Failed to bulk update activities:', error)
  }
}
