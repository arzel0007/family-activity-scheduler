import { db, auth } from './firebase'
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore'

export interface ArchivedActivity {
  id: string
  title: string
  description: string
  dueDate: string
  dueTime: string
  kidIds: string[]
  completedAt: Date
  notes: string
}

export async function archiveActivity(activityId: string, notes: string = '') {
  if (!auth.currentUser) return

  try {
    const activityDoc = await getDocs(
      query(collection(db, 'activities'), where('__name__', '==', activityId))
    )
    
    if (activityDoc.empty) return

    const activity = activityDoc.docs[0].data()
    
    await addDoc(collection(db, 'archivedActivities'), {
      ...activity,
      originalId: activityId,
      completedAt: Timestamp.now(),
      notes,
      userId: auth.currentUser.uid
    })

    await updateDoc(doc(db, 'activities', activityId), { archived: true })
  } catch (error) {
    console.error('Failed to archive activity:', error)
  }
}

export async function getArchivedActivities() {
  if (!auth.currentUser) return []

  try {
    const q = query(
      collection(db, 'archivedActivities'),
      where('userId', '==', auth.currentUser.uid)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ArchivedActivity[]
  } catch (error) {
    console.error('Failed to fetch archived activities:', error)
    return []
  }
}
