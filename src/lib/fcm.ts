import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { initializeApp } from 'firebase/app'
import { firebaseConfig } from './firebase'

const app = initializeApp(firebaseConfig)

const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY || ''

export async function initFCM() {
  try {
    if (!VAPID_KEY) {
      return null
    }

    const messaging = getMessaging(app)
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    return token
  } catch (error) {
    console.error('FCM initialization failed:', error)
    return null
  }
}

export function listenForMessages(callback: (payload: any) => void) {
  try {
    const messaging = getMessaging(app)
    onMessage(messaging, callback)
  } catch (error) {
    console.error('Message listener setup failed:', error)
  }
}
