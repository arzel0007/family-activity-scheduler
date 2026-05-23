/*
Promote a user to super_admin by email.
Requires:
- GOOGLE_APPLICATION_CREDENTIALS pointing to a Firebase service account JSON
- FIREBASE_PROJECT_ID set to your Firebase project ID

Usage:
  node scripts/promote-user-to-admin.cjs [--dry-run|-n] user@example.com

Options:
  --dry-run, -n    Print matched user documents without writing changes
*/

const admin = require('firebase-admin')

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run') || args.includes('-n')
  const email = args.find((a) => !a.startsWith('-'))

  if (!email) {
    console.error('Usage: node scripts/promote-user-to-admin.cjs [--dry-run|-n] user@example.com')
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
      console.error(`No user profiles found for email: ${normalized}`)
      process.exit(2)
    }

    if (dryRun) {
      console.log(`Dry-run: found ${snapshot.size} user doc(s) for ${normalized}`)
      snapshot.docs.forEach((d) => {
        console.log('---')
        console.log('docId:', d.id)
        console.log(JSON.stringify(d.data(), null, 2))
      })
      process.exit(0)
    }

    // Update all matched documents
    for (const d of snapshot.docs) {
      await d.ref.set({ role: 'super_admin', updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
      console.log(`Promoted ${normalized} to super_admin (doc id: ${d.id})`)
    }

    process.exit(0)
  } catch (err) {
    console.error('Error promoting user:', err)
    process.exit(3)
  }
}

main()
