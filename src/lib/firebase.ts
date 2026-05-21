import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDYUIRHyvdLtbQK0GuL4pUEz1FHLD3LrBw',
  authDomain: 'family-activity-scheduler.firebaseapp.com',
  projectId: 'family-activity-scheduler',
  storageBucket: 'family-activity-scheduler.firebasestorage.app',
  messagingSenderId: '341186563702',
  appId: '1:341186563702:web:f0525722115bcc50ef1957',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
