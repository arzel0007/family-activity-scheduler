#!/usr/bin/env node
/*
Merge duplicate user documents in Firestore for the same email.
Usage:
  node scripts/merge-user-docs.cjs [--dry-run|-n] [--keep <docId>] user@example.com

Options:
  --dry-run, -n    Print planned operations without modifying data
  --keep <docId>   Prefer this doc id as the primary (target) doc

Behavior:
- Finds all user documents with the given email (lowercased).
- Selects a primary doc (keep flag > doc with role 'super_admin' > most recently updated > first).
- For each other doc (source):
  - Reparent documents that reference the old user id in common collections by updating userId fields to the primary id.
  - For activities, also replace occurrences of the old id inside array fields 'inviteeIds'.
  - Merge non-empty profile fields into the primary doc (displayName, photoURL, role if more permissive).
  - Delete the old user doc after migrating references.

Note: This script attempts safe default behavior but strongly recommend running with --dry-run first.
*/

const admin = require('firebase-admin')

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run') || args.includes('-n')
  const keepIndex = args.indexOf('--keep')
  let keepId = null
  if (keepIndex !== -1 && args[keepIndex + 1]) keepId = args[keepIndex + 1]
  const email = args.find((a) => !a.startsWith('-') && a !== keepId)

  if (!email) {
    console.error('Usage: node scripts/merge-user-docs.cjs [--dry-run|-n] [--keep <docId>] user@example.com')
    process.exit(1)
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('GOOGLE_APPLICATION_CREDENTIALS is not set.')
    process.exit(1)
  }
  if (!process.env.FIREBASE_PROJECT_ID) {
    console.error('FIREBASE_PROJECT_ID is not set.')
    process.exit(1)
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  })

  const db = admin.firestore()
  const normalized = email.trim().toLowerCase()
  const usersSnap = await db.collection('users').where('email', '==', normalized).get()

  if (usersSnap.empty) {
    console.error('No user docs found for', normalized)
    process.exit(2)
  }

  const docs = usersSnap.docs.map((d) => ({ id: d.id, data: d.data() }))
  console.log(`Found ${docs.length} user doc(s) for ${normalized}`)

  // Determine primary
  let primary = null
  if (keepId) {
    primary = docs.find((d) => d.id === keepId)
    if (!primary) {
      console.error('Keep doc id not found among matches:', keepId)
      process.exit(1)
    }
  }
  if (!primary) {
    primary = docs.find((d) => d.data.role === 'super_admin')
  }
  if (!primary) {
    // pick most recent updatedAt, fall back to first
    docs.sort((a, b) => {
      const aTs = (a.data.updatedAt && a.data.updatedAt._seconds) || 0
      const bTs = (b.data.updatedAt && b.data.updatedAt._seconds) || 0
      return bTs - aTs
    })
    primary = docs[0]
  }

  const primaryId = primary.id
  console.log('Selected primary doc:', primaryId)

  // collections to update where documents have a 'userId' field
  const collectionsToPatch = ['kids', 'activities', 'tags', 'recurringActivities', 'notes', 'user_kids']

  const sources = docs.filter((d) => d.id !== primaryId)
  if (sources.length === 0) {
    console.log('No duplicate docs to merge. Exiting.')
    process.exit(0)
  }

  console.log('Source docs to merge:', sources.map((s) => s.id).join(', '))

  // Dry-run: list affected docs per collection
  for (const src of sources) {
    console.log(`\nPlanning migration from ${src.id} -> ${primaryId}`)
    for (const col of collectionsToPatch) {
      const q = db.collection(col).where('userId', '==', src.id)
      const snap = await q.get()
      if (!snap.empty) {
        console.log(`Collection '${col}' has ${snap.size} doc(s) referencing userId ${src.id}`)
        if (dryRun) snap.docs.forEach((d) => console.log(`  - ${col}/${d.id}`))
      }
    }
    // activities inviteeIds array
    const actQ = db.collection('activities').where('inviteeIds', 'array-contains', src.id)
    const actSnap = await actQ.get()
    if (!actSnap.empty) {
      console.log(`Activities with inviteeIds containing ${src.id}: ${actSnap.size}`)
      if (dryRun) actSnap.docs.forEach((d) => console.log(`  - activities/${d.id}`))
    }
  }

  if (dryRun) {
    console.log('\nDry-run complete. No changes made.')
    process.exit(0)
  }

  // Execute migration
  for (const src of sources) {
    console.log(`\nMigrating references from ${src.id} -> ${primaryId}`)
    for (const col of collectionsToPatch) {
      const q = db.collection(col).where('userId', '==', src.id)
      const snap = await q.get()
      for (const d of snap.docs) {
        console.log(`  Patching ${col}/${d.id} -> userId=${primaryId}`)
        await d.ref.set({ userId: primaryId }, { merge: true })
      }
    }

    // Update inviteeIds arrays in activities
    const actQ = db.collection('activities').where('inviteeIds', 'array-contains', src.id)
    const actSnap = await actQ.get()
    for (const d of actSnap.docs) {
      const data = d.data()
      const inviteeIds = data.inviteeIds || []
      const newInviteeIds = inviteeIds.map((id) => (id === src.id ? primaryId : id))
      // ensure uniqueness
      const dedup = Array.from(new Set(newInviteeIds))
      console.log(`  Updating activities/${d.id} inviteeIds -> [${dedup.join(',')}]`)
      await d.ref.set({ inviteeIds: dedup }, { merge: true })
    }

    // Merge profile fields from source into primary (non-empty wins)
    const primaryRef = db.collection('users').doc(primaryId)
    const srcRef = db.collection('users').doc(src.id)
    const srcDoc = (await srcRef.get()).data() || {}
    const primDocSnap = await primaryRef.get()
    const primDoc = primDocSnap.data() || {}

    const merged = {
      displayName: primDoc.displayName || srcDoc.displayName || '',
      photoURL: primDoc.photoURL || srcDoc.photoURL || '',
      // prefer the more permissive role: if either is super_admin, result is super_admin
      role: (primDoc.role === 'super_admin' || srcDoc.role === 'super_admin') ? 'super_admin' : (primDoc.role || srcDoc.role || 'parent'),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
    console.log(`  Merging profile fields into ${primaryId}:`, merged)
    await primaryRef.set(merged, { merge: true })

    // Delete source doc
    console.log(`  Deleting source user doc ${src.id}`)
    await srcRef.delete()
  }

  console.log('\nMerge complete.')
  process.exit(0)
}

main().catch((e) => { console.error('Fatal error', e); process.exit(1) })
