import { useEffect, useState } from 'react'
import { getSyncQueueStatus, processSyncQueue } from '../lib/useNetworkStatus'
import { useNetworkStatus } from '../lib/useNetworkStatus'

export function SyncStatus() {
  const { status } = useNetworkStatus()
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const { pending } = getSyncQueueStatus()
    setPendingCount(pending)
  }, [])

  useEffect(() => {
    if (status !== 'online' || pendingCount === 0) return

    setIsSyncing(true)
    processSyncQueue()
      .then(() => {
        const { pending } = getSyncQueueStatus()
        setPendingCount(pending)
        setIsSyncing(false)
      })
      .catch(() => {
        setIsSyncing(false)
      })
  }, [status, pendingCount])

  if (pendingCount === 0) return null

  return (
    <div 
      className="fixed bottom-4 right-4 bg-sky-blue text-charcoal-black px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
      role="status"
      aria-live="polite"
    >
      {isSyncing ? (
        <>
          <div className="spinner"></div>
          <span>Syncing {pendingCount} change{pendingCount !== 1 ? 's' : ''}...</span>
        </>
      ) : (
        <>
          <span>✓</span>
          <span>{pendingCount} pending change{pendingCount !== 1 ? 's' : ''}</span>
        </>
      )}
    </div>
  )
}
