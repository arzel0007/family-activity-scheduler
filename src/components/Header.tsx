import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { getUserProfile } from '../lib/userProfile'
import { setupKeyboardShortcuts } from '../lib/keyboardShortcuts'
import { UserMenu } from './UserMenu'

interface HeaderProps {
  onAddActivity: () => void
  onExport: () => void
  onImport: (file: File) => void
  onSearch: () => void
}

export function Header({ onAddActivity, onExport, onImport, onSearch }: HeaderProps) {
  const { user, isSuperAdmin } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [photoURL, setPhotoURL] = useState<string | undefined>()

  useEffect(() => {
    if (!user) return
    getUserProfile(user.uid).then((profile) => {
      setDisplayName(profile?.displayName || user.displayName || '')
      setPhotoURL(profile?.photoURL || user.photoURL || undefined)
    })
  }, [user])

  useEffect(() => {
    const cleanup = setupKeyboardShortcuts({
      onAddActivity,
      onSearch,
      onExport,
    })
    return cleanup
  }, [onAddActivity, onExport, onSearch])

  const profileName = displayName || user?.email || 'Parent'

  return (
    <>
      <div className="posthog-brand-bar" aria-hidden />
      <header className="bg-surface-white border-b border-pale-granite">
        <div className="max-w-[958px] mx-auto px-6 py-5 flex justify-between items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-charcoal-black tracking-tight flex items-center gap-2 flex-wrap">
              Family Activity Scheduler
              {isSuperAdmin && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-marigold-yellow text-ink-black">
                  Super Admin
                </span>
              )}
            </h1>
            <p className="text-sm text-graphite-grey mt-2 max-w-2xl">
              Keep your family on track with shared activities, reminders, and parent coordination.
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2 items-center">
            <UserMenu
              displayName={profileName}
              photoURL={photoURL}
              onProfileUpdate={(url, name) => {
                if (url) setPhotoURL(url)
                if (name) setDisplayName(name)
              }}
              onImport={onImport}
            />
            <button onClick={onSearch} className="btn-secondary" title="Search (Cmd+F)">
              🔍
            </button>
            <button onClick={onAddActivity} className="btn-primary" title="Add Activity (Cmd+K)">
              + Activity
            </button>
            <button onClick={onExport} className="btn-secondary" title="Add to calendar (Cmd+E)">
              📅 Add to Calendar
            </button>
          </div>
        </div>
      </header>
    </>
  )
}
