/*
Promote a user to super_admin by email.
Requires:
- GOOGLE_APPLICATION_CREDENTIALS pointing to a Firebase service account JSON
- FIREBASE_PROJECT_ID set to your Firebase project ID

Usage:
  node scripts/promote-user-to-admin.js user@example.com
*/

const admin = require('firebase-admin')

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: node scripts/promote-user-to-admin.js user@example.com')
    process.exit(1)
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('GOOGLE_APPLICATION_CREDENTIALS is not set. Export path to service account JSON.')
    process.exit(1)
  }

  if (!process.env.FIREBASE_PROJECT_ID) {
    console.error('FIREBASE_PROJECT_ID is not set. Export your Firebase project id as FIREBASE_PROJECT_ID.')
    process.exit(1)
  }

  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    })

    const db = admin.firestore()
    const usersRef = db.collection('users')
    const normalized = email.trim().toLowerCase()
    const snapshot = await usersRef.where('email', '==', normalized).get()

    if (snapshot.empty) {
      console.error(`No user profile found for email: ${normalized}`)
      process.exit(2)
    }

    const docSnap = snapshot.docs[0]
    await docSnap.ref.set({ role: 'super_admin', updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })

    console.log(`Promoted ${normalized} to super_admin (doc id: ${docSnap.id})`)
    process.exit(0)
  } catch (err) {
    console.error('Error promoting user:', err)
    process.exit(3)
  }
}

main()
