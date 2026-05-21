import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { getUserProfile, updateUserProfile } from '../lib/userProfile'
import { uploadProfilePhoto, parentPhotoPath, photoUploadSuccessMessage } from '../lib/storage'
import { PhotoUpload } from './PhotoUpload'
import { Modal } from './Modal'
import { useToast } from '../lib/toast'

interface ParentProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onProfileUpdate?: (photoURL?: string, displayName?: string) => void
}

export function ParentProfileModal({ isOpen, onClose, onProfileUpdate }: ParentProfileModalProps) {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [displayName, setDisplayName] = useState('')
  const [photoURL, setPhotoURL] = useState<string | undefined>()
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen || !user) return

    setLoading(true)
    getUserProfile(user.uid)
      .then((profile) => {
        setDisplayName(profile?.displayName || user.displayName || '')
        setPhotoURL(profile?.photoURL || user.photoURL || undefined)
      })
      .finally(() => setLoading(false))
  }, [isOpen, user])

  async function handlePhotoUpload(file: File) {
    if (!user) return
    setUploading(true)
    try {
      const result = await uploadProfilePhoto(
        `${parentPhotoPath(user.uid)}_${Date.now()}`,
        file
      )
      await updateUserProfile(user.uid, { photoURL: result.url })
      setPhotoURL(result.url)
      onProfileUpdate?.(result.url, displayName)
      addToast({
        message: photoUploadSuccessMessage(result, 'Profile photo'),
        type: 'success',
      })
    } catch (err: unknown) {
      addToast({
        message: err instanceof Error ? err.message : 'Failed to upload photo',
        type: 'error',
      })
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    try {
      await updateUserProfile(user.uid, { displayName: displayName.trim() })
      onProfileUpdate?.(photoURL, displayName.trim())
      addToast({ message: 'Profile saved', type: 'success' })
      onClose()
    } catch {
      addToast({ message: 'Failed to save profile', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const profileName = displayName || user?.email || 'Parent'

  return (
    <Modal
      isOpen={isOpen}
      title="Parent Profile"
      onClose={onClose}
      actions={[
        {
          label: saving ? 'Saving...' : 'Save',
          onClick: handleSave,
          variant: 'primary',
          disabled: saving || loading,
        },
      ]}
    >
      {loading ? (
        <p className="text-graphite-grey">Loading profile...</p>
      ) : (
        <div className="space-y-4">
          <PhotoUpload
            name={profileName}
            photoURL={photoURL}
            onFileSelect={handlePhotoUpload}
            uploading={uploading}
            label="Parent profile photo"
          />
          <div>
            <label className="label">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="input"
            />
          </div>
          <p className="text-sm text-graphite-grey">{user?.email}</p>
        </div>
      )}
    </Modal>
  )
}
