import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth'
import { auth } from './firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { ensureUserProfile, getUserProfile, isAccountDisabled } from './userProfile'
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
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        await ensureUserProfile(firebaseUser).catch(console.error)

        if (await isAccountDisabled(firebaseUser.uid)) {
          setAuthNotice('This account has been disabled. Contact support.')
          await signOut(auth)
          setUser(null)
          setIsSuperAdmin(false)
          setLoading(false)
          return
        }

        const profile = await getUserProfile(firebaseUser.uid)
        setIsSuperAdmin(isSuperAdminUser(firebaseUser.email, profile?.role))
        setUser(firebaseUser)
      } else {
        setUser(null)
        setIsSuperAdmin(false)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signUp = async (email: string, password: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await ensureUserProfile(credential.user)
  }

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    const isLocalHost =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

    if (isLocalHost) {
      const credential = await signInWithPopup(auth, provider)
      if (credential.user) {
        await ensureUserProfile(credential.user)
      }
      return
    }

    await signInWithRedirect(auth, provider)
  }

  const handleSignOut = async () => {
    await signOut(auth)
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
