import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'

export function LoginPage() {
  const { signIn, signUp, signInWithGoogle, authNotice, clearAuthNotice } = useAuth()
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
        // Don't show toast - let redirect to main app be the success feedback
      } else {
        await signIn(email, password)
        // Auth state will update via onAuthStateChanged, triggering redirect
      }
    } catch (err: any) {
      addToast({ message: err.message || 'Authentication failed', type: 'error' })
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

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-pale-granite" />
          <span className="text-xs uppercase tracking-[0.3em] text-faded-grey">or</span>
          <span className="h-px flex-1 bg-pale-granite" />
        </div>

        <button
          type="button"
          onClick={async () => {
            setLoading(true)
            try {
              await signInWithGoogle()
            } catch (err: any) {
              addToast({ message: err.message || 'Google sign-in failed', type: 'error' })
              setLoading(false)
            }
          }}
          className="w-full btn-secondary mt-3 inline-flex items-center justify-center gap-2 disabled:opacity-50"
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
            <path d="M21.35 11.1H12v2.8h5.35c-.25 1.55-1.35 2.85-2.85 3.55v2.95h4.6c2.7-2.5 4.25-6.15 4.25-10.5 0-.7-.05-1.4-.15-2.1Z" fill="#4285F4" />
            <path d="M12 22c2.43 0 4.47-.8 5.96-2.18l-4.6-2.95c-1.27.85-2.9 1.35-4.66 1.35-3.57 0-6.6-2.4-7.68-5.65H.68v3.55C2.15 19.8 6.64 22 12 22Z" fill="#34A853" />
            <path d="M4.32 13.57c-.3-.9-.47-1.85-.47-2.82 0-.98.17-1.92.47-2.82V4.38H.68A11.97 11.97 0 0 0 0 10.75c0 1.92.46 3.74 1.28 5.35l3.04-2.53Z" fill="#FBBC05" />
            <path d="M12 4.5c1.66 0 3.15.57 4.33 1.69l3.24-3.24C16.46 1 14.44 0 12 0 6.64 0 2.15 2.2.68 5.38l3.63 2.82C5.4 6.9 8.43 4.5 12 4.5Z" fill="#EA4335" />
          </svg>
          {loading ? 'Please wait…' : 'Continue with Google'}
        </button>

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
