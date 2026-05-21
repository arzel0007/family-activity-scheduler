import { db, auth } from './firebase'
import { doc, setDoc, deleteDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore'

export async function subscribeParentToNotifications(fcmToken: string) {
  if (!auth.currentUser) return

  try {
    await setDoc(
      doc(db, 'users', auth.currentUser.uid, 'fcmTokens', fcmToken),
      { token: fcmToken, createdAt: Timestamp.now() }
    )
  } catch (error) {
    console.error('Failed to subscribe to notifications:', error)
  }
}

export async function unsubscribeParentFromNotifications(fcmToken: string) {
  if (!auth.currentUser) return

  try {
    await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'fcmTokens', fcmToken))
  } catch (error) {
    console.error('Failed to unsubscribe from notifications:', error)
  }
}

export async function getParentTokensForChild(childId: string) {
  try {
    const userKidsQuery = query(
      collection(db, 'user_kids'),
      where('kidId', '==', childId)
    )
    const userKidsDocs = await getDocs(userKidsQuery)
    
    const tokens: string[] = []
    for (const userKidDoc of userKidsDocs.docs) {
      const userId = userKidDoc.data().userId
      const tokensQuery = query(
        collection(db, 'users', userId, 'fcmTokens')
      )
      const tokensDocs = await getDocs(tokensQuery)
      tokens.push(...tokensDocs.docs.map(doc => doc.data().token))
    }
    
    return tokens
  } catch (error) {
    console.error('Failed to get parent tokens:', error)
    return []
  }
}
