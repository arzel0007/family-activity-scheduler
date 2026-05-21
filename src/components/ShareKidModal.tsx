import { useState } from 'react'
import { db } from '../lib/firebase'
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore'

interface Kid {
  id: string
  name: string
}

interface Props {
  kid: Kid
  onClose: () => void
  onShare: () => void
}

export function ShareKidModal({ kid, onClose, onShare }: Props) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleShare() {
    if (!email.trim()) return

    setLoading(true)
    try {
      // Find user by email (simplified - in production use Firebase Admin SDK)
      const usersQuery = query(collection(db, 'users'), where('email', '==', email))
      const snapshot = await getDocs(usersQuery)

      if (snapshot.empty) {
        setMessage('User not found')
        setLoading(false)
        return
      }

      const userId = snapshot.docs[0].id

      // Add shared kid entry
      await addDoc(collection(db, 'sharedKids'), {
        kidId: kid.id,
        userId: userId,
        sharedBy: 'current-user',
        createdAt: new Date(),
      })

      setMessage(`Successfully shared ${kid.name} with ${email}`)
      setEmail('')
      onShare()
    } catch (err) {
      console.error('Error sharing kid:', err)
      setMessage('Error sharing kid')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-ink-black bg-opacity-25 flex items-center justify-center">
      <div className="bg-surface-white p-6 rounded-md border border-pale-granite shadow-xl max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-charcoal-black">Share {kid.name}</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Parent Email</label>
            <input
              type="email"
              placeholder="parent@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>
          {message && (
            <p className={`text-sm ${message.includes('Successfully') ? 'text-vivid-green' : 'text-sunset-orange'}`}>
              {message}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {loading ? 'Sharing...' : 'Share'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
