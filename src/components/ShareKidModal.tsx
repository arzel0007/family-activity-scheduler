import { useState } from 'react'
import { shareKidActivitiesWithParent } from '../lib/sharing'
import { Avatar } from './Avatar'
import { useToast } from '../lib/toast'
import type { Kid } from '../lib/types'

interface Props {
  kid: Kid
  onClose: () => void
  onShare: () => void
}

export function ShareKidModal({ kid, onClose, onShare }: Props) {
  const { addToast } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleShare() {
    if (!email.trim()) return

    setLoading(true)
    try {
      const { sharedCount, inviteeEmail } = await shareKidActivitiesWithParent(kid, email)
      addToast({
        message: `Shared ${sharedCount} ${sharedCount === 1 ? 'activity' : 'activities'} with ${inviteeEmail}. They were added as invitees.`,
        type: 'success',
      })
      setEmail('')
      onShare()
    } catch (err: unknown) {
      addToast({
        message: err instanceof Error ? err.message : 'Error sharing activities',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-ink-black bg-opacity-25 flex items-center justify-center z-50">
      <div className="bg-surface-white">
        <div className="flex items-center gap-3 mb-4">
          <Avatar name={kid.name} photoURL={kid.photoURL} size="md" />
          <div>
            <h2 className="text-xl font-bold text-charcoal-black">
              Share {kid.name}&apos;s activities
            </h2>
            <p className="text-sm text-graphite-grey">
              Invites another parent to all activities for this kid
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Parent email</label>
            <input
              type="email"
              placeholder="parent@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
            <p className="text-xs text-graphite-grey mt-1">
              They must already have an account. They will see shared activities and be listed as invitees.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              disabled={loading || !email.trim()}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {loading ? 'Sharing...' : 'Share activities'}
            </button>
            <button onClick={onClose} className="flex-1 btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
