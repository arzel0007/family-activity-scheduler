import { useState, useEffect } from 'react'

export type NetworkStatus = 'online' | 'offline' | 'slow'

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>('online')
  const [effectiveType, setEffectiveType] = useState<string>('4g')

  useEffect(() => {
    // Check initial status
    setStatus(navigator.onLine ? 'online' : 'offline')

    // Get effective connection type if available
    const connection = (navigator as any).connection
    if (connection) {
      setEffectiveType(connection.effectiveType)
    }

    // Listen for online/offline events
    const handleOnline = () => setStatus('online')
    const handleOffline = () => setStatus('offline')

    const handleConnectionChange = () => {
      const conn = (navigator as any).connection
      if (conn) {
        const type = conn.effectiveType
        setEffectiveType(type)
        // Mark as slow if on 3g or slower
        if (type === '3g' || type === '2g') {
          setStatus('slow')
        } else if (navigator.onLine) {
          setStatus('online')
        }
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if (connection) {
      connection.addEventListener('change', handleConnectionChange)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange)
      }
    }
  }, [])

  return { status, effectiveType }
}

// Queue for offline actions
interface QueuedAction {
  id: string
  action: () => Promise<any>
  timestamp: number
  retries: number
}

const syncQueue: QueuedAction[] = []

export function addToSyncQueue(action: () => Promise<any>) {
  const id = `${Date.now()}-${Math.random()}`
  syncQueue.push({
    id,
    action,
    timestamp: Date.now(),
    retries: 0
  })
  return id
}

export function removFromSyncQueue(id: string) {
  const index = syncQueue.findIndex(item => item.id === id)
  if (index > -1) {
    syncQueue.splice(index, 1)
  }
}

export async function processSyncQueue() {
  for (const item of syncQueue) {
    if (item.retries > 3) continue // Skip after 3 retries

    try {
      await item.action()
      removFromSyncQueue(item.id)
    } catch (error) {
      item.retries++
      console.error(`Sync failed for ${item.id}, retry ${item.retries}:`, error)
    }
  }
}

export function getSyncQueueStatus() {
  return {
    pending: syncQueue.length,
    items: syncQueue
  }
}
