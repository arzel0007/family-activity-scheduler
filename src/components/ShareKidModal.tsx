import { useState } from 'react'
import { supabase } from '../lib/supabase'

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
      // Get the user by email
      const { data: userData, error: userError } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', email)
        .single()

      if (userError || !userData) {
        setMessage('User not found')
        return
      }

      // Add user_kids entry
      const { error } = await supabase.from('user_kids').insert([
        {
          user_id: userData.id,
          kid_id: kid.id,
          role: 'parent',
        },
      ])

      if (error) {
        if (error.code === '23505') {
          setMessage('This user already has access to this kid')
        } else {
          setMessage('Error sharing kid')
        }
        return
      }

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Share {kid.name}</h2>
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Parent email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
          {message && (
            <p className={`text-sm ${message.includes('Successfully') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              disabled={loading}
              className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Sharing...' : 'Share'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
