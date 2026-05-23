import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { useAuth } from '../lib/auth'
import { Avatar } from './Avatar'
import { ParentProfileModal } from './ParentProfileModal'

interface UserMenuProps {
  displayName: string
  photoURL?: string
  onProfileUpdate?: (photoURL?: string, displayName?: string) => void
  onImport?: (file: File) => void
}

export function UserMenu({ displayName, photoURL, onProfileUpdate, onImport }: UserMenuProps) {
  const { signOut, isSuperAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  async function handleSignOut() {
    setSigningOut(true)
    setOpen(false)
    try {
      await signOut()
    } finally {
      setSigningOut(false)
    }
  }

  function handleImportClick() {
    setOpen(false)
    inputRef.current?.click()
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    onImport?.(file)
    event.target.value = ''
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <input
          ref={inputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 btn-ghost rounded-full pr-2"
          aria-expanded={open}
          aria-haspopup="menu"
          title="Account options"
        >
          <Avatar name={displayName} photoURL={photoURL} size="sm" />
          <span className="hidden sm:inline text-sm font-medium text-charcoal-black max-w-[120px] truncate">
            {displayName}
          </span>
          <span className="text-faded-grey text-xs" aria-hidden>
            {open ? '▲' : '▼'}
          </span>
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 min-w-[200px] py-1 bg-surface-white border border-pale-granite rounded shadow-xl z-50"
            style={{ boxShadow: 'var(--shadow-xl)' }}
          >
            <div className="px-3 py-2 border-b border-pale-granite">
              <p className="text-sm font-medium text-charcoal-black truncate">{displayName}</p>
              {isSuperAdmin && (
                <p className="text-xs text-faded-grey">Super admin</p>
              )}
            </div>
            <button
              type="button"
              role="menuitem"
              className="w-full text-left px-3 py-2 text-sm text-charcoal-black hover:bg-warm-gray-tint transition-colors"
              onClick={() => {
                setOpen(false)
                setShowProfile(true)
              }}
            >
              Profile & photo
            </button>
            {onImport && (
              <button
                type="button"
                role="menuitem"
                className="w-full text-left px-3 py-2 text-sm text-charcoal-black hover:bg-warm-gray-tint transition-colors"
                onClick={handleImportClick}
              >
                📥 Import data
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              disabled={signingOut}
              className="w-full text-left px-3 py-2 text-sm text-charcoal-black hover:bg-warm-gray-tint transition-colors disabled:opacity-50 border-t border-pale-granite"
              onClick={handleSignOut}
            >
              {signingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        )}
      </div>

      <ParentProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        onProfileUpdate={onProfileUpdate}
      />
    </>
  )
}
