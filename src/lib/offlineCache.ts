const DB_NAME = 'FamilySchedulerDB'
const ACTIVITIES_STORE = 'activities'
const KIDS_STORE = 'kids'

let db: IDBDatabase

export async function initIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result
      if (!database.objectStoreNames.contains(ACTIVITIES_STORE)) {
        database.createObjectStore(ACTIVITIES_STORE, { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains(KIDS_STORE)) {
        database.createObjectStore(KIDS_STORE, { keyPath: 'id' })
      }
    }
  })
}

export async function saveActivitiesToCache(activities: any[]) {
  if (!db) await initIndexedDB()
  const transaction = db.transaction([ACTIVITIES_STORE], 'readwrite')
  const store = transaction.objectStore(ACTIVITIES_STORE)

  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => {
      console.log('saveActivitiesToCache: transaction complete', activities.length)
      resolve()
    }
    transaction.onerror = () => {
      console.error('saveActivitiesToCache: transaction error', transaction.error)
      reject(transaction.error)
    }

    for (const activity of activities) {
      store.put(activity)
    }
  })
}

export async function getCachedActivities(): Promise<any[]> {
  if (!db) await initIndexedDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ACTIVITIES_STORE], 'readonly')
    const store = transaction.objectStore(ACTIVITIES_STORE)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      console.log('getCachedActivities: loaded', (request.result || []).length)
      resolve(request.result)
    }
  })
}

export async function saveKidsToCache(kids: any[]) {
  if (!db) await initIndexedDB()
  const transaction = db.transaction([KIDS_STORE], 'readwrite')
  const store = transaction.objectStore(KIDS_STORE)

  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => {
      console.log('saveKidsToCache: transaction complete', kids.length)
      resolve()
    }
    transaction.onerror = () => {
      console.error('saveKidsToCache: transaction error', transaction.error)
      reject(transaction.error)
    }

    for (const kid of kids) {
      store.put(kid)
    }
  })
}

export async function getCachedKids(): Promise<any[]> {
  if (!db) await initIndexedDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([KIDS_STORE], 'readonly')
    const store = transaction.objectStore(KIDS_STORE)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      console.log('getCachedKids: loaded', (request.result || []).length)
      resolve(request.result)
    }
  })
}
