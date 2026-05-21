import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'

export function LoginPage() {
  const { signIn, signUp, authNotice, clearAuthNotice } = useAuth()
  const { addToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password)
        addToast({ message: 'Account created successfully', type: 'success' })
      } else {
        await signIn(email, password)
        addToast({ message: 'Signed in successfully', type: 'success' })
      }
    } catch (err: any) {
      addToast({ message: err.message || 'Authentication failed', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas-sand flex items-center justify-center px-4">
      <div className="bg-canvas-sand p-8 rounded-md border border-pale-granite max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-8 text-charcoal-black">Family Activity Scheduler</h1>

        {authNotice && (
          <p className="mb-4 p-3 rounded bg-sunset-orange/20 text-charcoal-black text-sm text-center">
            {authNotice}
            <button type="button" onClick={clearAuthNotice} className="block mx-auto mt-1 text-sky-blue text-xs">
              Dismiss
            </button>
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-graphite-grey text-sm">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
              }}
              className="text-sky-blue hover:underline ml-2 font-medium"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
