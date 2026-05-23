import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  User,
  GoogleAuthProvider,
  browserLocalPersistence,
  getRedirectResult,
  setPersistence,
  signInWithRedirect,
} from 'firebase/auth'
import { auth } from './firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { ensureUserProfile, getUserProfile } from './userProfile'
import { isSuperAdminUser } from './admin'

interface AuthContextType {
  user: User | null
  loading: boolean
  isSuperAdmin: boolean
  authNotice: string | null
  clearAuthNotice: () => void
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [authNotice, setAuthNotice] = useState<string | null>(null)

  useEffect(() => {
    console.log('[AuthDebug] AuthProvider mounted at', new Date().toISOString())
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log('[AuthDebug] auth persistence set to local')
        return getRedirectResult(auth)
      })
      .then((result) => {
        console.log('[AuthDebug] getRedirectResult resolved', {
          hasResult: !!result,
          uid: result?.user?.uid || null,
          email: result?.user?.email || null,
        })
        if (result?.user) {
          console.log('Google signed-in email:', result.user.email)
        }
      })
      .catch((err) => {
        console.error('[AuthDebug] auth bootstrap error', err)
      })

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      console.log('[AuthDebug] onAuthStateChanged fired', {
        hasUser: !!firebaseUser,
        uid: firebaseUser?.uid || null,
        email: firebaseUser?.email || null,
      })
      if (firebaseUser) {
        console.log('[AuthDebug] ensureUserProfile start', firebaseUser.uid)
        await ensureUserProfile(firebaseUser).catch(console.error)
        console.log('[AuthDebug] ensureUserProfile complete', firebaseUser.uid)

        console.log('[AuthDebug] getUserProfile start', firebaseUser.uid)
        const profile = await getUserProfile(firebaseUser.uid)
        console.log('[AuthDebug] getUserProfile complete', {
          uid: firebaseUser.uid,
          role: profile?.role || null,
        })

        if (profile?.role === 'disabled') {
          console.warn('[AuthDebug] account disabled, signing out', firebaseUser.uid)
          setAuthNotice('This account has been disabled. Contact support.')
          await signOut(auth)
          setUser(null)
          setIsSuperAdmin(false)
          setLoading(false)
          return
        }

        setIsSuperAdmin(isSuperAdminUser(firebaseUser.email, profile?.role))
        setUser(firebaseUser)
        console.log('[AuthDebug] user accepted in session', {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: profile?.role || null,
        })
      } else {
        console.log('[AuthDebug] no auth user; setting logged-out state')
        setUser(null)
        setIsSuperAdmin(false)
      }
      setLoading(false)
      console.log('[AuthDebug] loading set to false')
    })
    return unsubscribe
  }, [])

  const signUp = async (email: string, password: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await ensureUserProfile(credential.user)
  }

  const signIn = async (email: string, password: string) => {
    console.log('[AuthDebug] email sign-in start', email)
    await signInWithEmailAndPassword(auth, email, password)
    console.log('[AuthDebug] email sign-in success', email)
  }

  const signInWithGoogle = async () => {
    console.log('[AuthDebug] google sign-in redirect start', window.location.href)
    const provider = new GoogleAuthProvider()
    await signInWithRedirect(auth, provider)
  }

  const handleSignOut = async () => {
    console.log('[AuthDebug] sign out start')
    await signOut(auth)
    console.log('[AuthDebug] sign out complete')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSuperAdmin,
        authNotice,
        clearAuthNotice: () => setAuthNotice(null),
        signUp,
        signIn,
        signInWithGoogle,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
