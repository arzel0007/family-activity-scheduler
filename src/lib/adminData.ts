import { db } from './firebase'
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore'
import type { UserProfile, Kid, Activity } from './types'
import type { UserRole } from './admin'

export type AdminUser = UserProfile & { id: string }
export type AdminKid = Kid & { id: string; ownerEmail?: string }
export type AdminActivity = Activity & { id: string; ownerEmail?: string }

export async function fetchAllUsers(): Promise<AdminUser[]> {
  const snapshot = await getDocs(collection(db, 'users'))
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() } as AdminUser))
    .sort((a, b) => (a.email || '').localeCompare(b.email || ''))
}

export async function fetchAllKids(): Promise<AdminKid[]> {
  const [kidsSnap, usersSnap] = await Promise.all([
    getDocs(collection(db, 'kids')),
    getDocs(collection(db, 'users')),
  ])
  const emailByUid = new Map(usersSnap.docs.map((d) => [d.id, d.data().email as string]))

  return kidsSnap.docs
    .map((d) => {
      const data = d.data()
      return {
        id: d.id,
        name: data.name,
        age: data.age,
        photoURL: data.photoURL,
        userId: data.userId,
        ownerEmail: emailByUid.get(data.userId) || data.userId,
      } as AdminKid
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function fetchAllActivities(): Promise<AdminActivity[]> {
  const [actSnap, usersSnap] = await Promise.all([
    getDocs(collection(db, 'activities')),
    getDocs(collection(db, 'users')),
  ])
  const emailByUid = new Map(usersSnap.docs.map((d) => [d.id, d.data().email as string]))

  return actSnap.docs
    .map((d) => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      notes: data.notes || [],
      kidIds: data.kidIds || [],
      tagIds: data.tagIds || [],
      ownerEmail: emailByUid.get(data.userId) || data.userId,
    } as AdminActivity
  })
    .sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''))
}

export async function adminUpdateUserRole(userId: string, role: UserRole) {
  await updateDoc(doc(db, 'users', userId), { role })
}

export async function adminUpdateUser(
  userId: string,
  updates: Partial<Pick<UserProfile, 'displayName' | 'role'>>
) {
  await updateDoc(doc(db, 'users', userId), updates)
}

export async function adminUpdateKid(kidId: string, updates: Partial<Pick<Kid, 'name' | 'age'>>) {
  await updateDoc(doc(db, 'kids', kidId), updates)
}

export async function adminDeleteKid(kidId: string) {
  await deleteDoc(doc(db, 'kids', kidId))
}

export async function adminDeleteActivity(activityId: string) {
  await deleteDoc(doc(db, 'activities', activityId))
}

export async function adminDeleteUser(userId: string) {
  const [kidsSnap, actSnap] = await Promise.all([
    getDocs(collection(db, 'kids')),
    getDocs(collection(db, 'activities')),
  ])

  const kidDeletes = kidsSnap.docs
    .filter((d) => d.data().userId === userId)
    .map((d) => deleteDoc(doc(db, 'kids', d.id)))

  const actDeletes = actSnap.docs
    .filter((d) => d.data().userId === userId)
    .map((d) => deleteDoc(doc(db, 'activities', d.id)))

  await Promise.all([...kidDeletes, ...actDeletes, deleteDoc(doc(db, 'users', userId))])
}
