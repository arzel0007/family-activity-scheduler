export interface Invitee {
  userId: string
  email: string
  displayName?: string
  addedAt?: Date
}

export interface KidSnapshot {
  id: string
  name: string
  photoURL?: string
}

export interface UserProfile {
  email: string
  displayName?: string
  photoURL?: string
  role?: 'parent' | 'super_admin' | 'disabled'
  updatedAt?: Date
  createdAt?: Date
}

export interface Kid {
  id: string
  name: string
  age?: number | null
  photoURL?: string
  userId?: string
}

export interface Activity {
  id: string
  title: string
  description?: string
  location?: string
  dueDate?: string
  dueTime?: string
  kidIds: string[]
  tagIds: string[]
  notes: { id: string; content: string }[]
  userId?: string
  ownerId?: string
  inviteeIds?: string[]
  invitees?: Invitee[]
  kidsOnActivity?: KidSnapshot[]
  shared?: boolean
  archived?: boolean
}
