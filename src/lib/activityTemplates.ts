import { db, auth } from './firebase'
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore'

export interface ActivityTemplate {
  id: string
  name: string
  title: string
  description: string
  dueTime: string
  tagIds: string[]
}

export async function createTemplate(template: Omit<ActivityTemplate, 'id'>) {
  if (!auth.currentUser) return

  try {
    await addDoc(collection(db, 'activityTemplates'), {
      ...template,
      userId: auth.currentUser.uid,
      createdAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Failed to create template:', error)
  }
}

export async function getTemplates() {
  if (!auth.currentUser) return []

  try {
    const q = query(
      collection(db, 'activityTemplates'),
      where('userId', '==', auth.currentUser.uid)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ActivityTemplate[]
  } catch (error) {
    console.error('Failed to fetch templates:', error)
    return []
  }
}
