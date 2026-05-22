import { useState, useEffect } from 'react'
import { useToast } from '../lib/toast'
import { linkSpouse, unlinkSpouse, getSpouse } from '../lib/spouse'

interface Props {
  userId: string
  onClose: () => void
  onSuccess: () => void
}

export function SpouseManagementModal({ userId, onClose, onSuccess }: Props) {
  const { addToast } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [spouse, setSpouse] = useState<{ id: string; email: string } | null>(null)
  const [loadingSpouse, setLoadingSpouse] = useState(true)

  useEffect(() => {
    loadSpouse()
  }, [userId])

  async function loadSpouse() {
    try {
      const spouseInfo = await getSpouse(userId)
      setSpouse(spouseInfo)
    } catch (error) {
      console.error('Failed to load spouse info:', error)
    } finally {
      setLoadingSpouse(false)
    }
  }

  async function handleLinkSpouse() {
    if (!email.trim()) return

    setLoading(true)
    try {
      await linkSpouse(userId, email.trim())
      addToast({
        message: `Successfully linked spouse: ${email}`,
        type: 'success',
      })
      setEmail('')
      onSuccess()
      await loadSpouse()
    } catch (err: unknown) {
      addToast({
        message: err instanceof Error ? err.message : 'Failed to link spouse',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleUnlinkSpouse() {
    if (!spouse) return

    setLoading(true)
    try {
      await unlinkSpouse(userId)
      addToast({
        message: 'Spouse relationship removed',
        type: 'success',
      })
      onSuccess()
      await loadSpouse()
    } catch (err: unknown) {
      addToast({
        message: err instanceof Error ? err.message : 'Failed to unlink spouse',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-charcoal-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-white p-6 md:p-8 rounded border border-pale-granite max-w-lg w-full mx-auto">
        <h2 className="text-xl font-bold text-charcoal-black mb-4">Manage Spouse Relationship</h2>
        <div className="space-y-4">
          {loadingSpouse ? (
            <p className="text-graphite-grey">Loading...</p>
          ) : spouse ? (
            <div className="bg-pale-granite p-4 rounded-md border border-graphite-grey">
              <p className="text-sm mb-2">
                <span className="font-semibold text-charcoal-black">Linked spouse:</span>
              </p>
              <p className="text-charcoal-black mb-3">{spouse.email}</p>
              <button
                onClick={handleUnlinkSpouse}
                disabled={loading}
                className="btn-secondary disabled:opacity-50 w-full"
              >
                {loading ? 'Unlinking...' : 'Remove spouse relationship'}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-graphite-grey mb-3">
                Link your account with your spouse to enable spouse-only sharing of kids and activities.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="label">Spouse email</label>
                  <input
                    type="email"
                    placeholder="spouse@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    disabled={loading}
                  />
                  <p className="text-xs text-graphite-grey mt-1">
                    Your spouse must already have an account and will need to approve the relationship.
                  </p>
                </div>
                <button
                  onClick={handleLinkSpouse}
                  disabled={loading || !email.trim()}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {loading ? 'Linking...' : 'Link spouse'}
                </button>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="btn-secondary w-full mt-4"
        >
          Close
        </button>
      </div>
    </div>
  )
}
