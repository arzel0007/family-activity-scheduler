import { db, auth } from './firebase'
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore'

export interface RecurringActivity {
  id: string
  title: string
  description: string
  dueTime: string
  kidIds: string[]
  tagIds: string[]
  recurrence: 'daily' | 'weekly' | 'monthly'
  recurrenceEnd?: string
  active: boolean
}

export async function createRecurringActivity(activity: Omit<RecurringActivity, 'id'>) {
  if (!auth.currentUser) return

  try {
    await addDoc(collection(db, 'recurringActivities'), {
      ...activity,
      userId: auth.currentUser.uid,
      createdAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Failed to create recurring activity:', error)
  }
}

export async function getRecurringActivities() {
  if (!auth.currentUser) return []

  try {
    const q = query(
      collection(db, 'recurringActivities'),
      where('userId', '==', auth.currentUser.uid),
      where('active', '==', true)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as RecurringActivity[]
  } catch (error) {
    console.error('Failed to fetch recurring activities:', error)
    return []
  }
}

export function generateNextDueDate(recurrence: string, baseDate: Date): string {
  const next = new Date(baseDate)
  switch (recurrence) {
    case 'daily':
      next.setDate(next.getDate() + 1)
      break
    case 'weekly':
      next.setDate(next.getDate() + 7)
      break
    case 'monthly':
      next.setMonth(next.getMonth() + 1)
      break
  }
  return next.toISOString().split('T')[0]
}
