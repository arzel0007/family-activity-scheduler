import { useRef } from 'react'
import { Avatar } from './Avatar'
import { MAX_PHOTO_MB } from '../lib/storage'

interface PhotoUploadProps {
  name: string
  photoURL?: string
  onFileSelect: (file: File) => void
  uploading?: boolean
  label?: string
}

export function PhotoUpload({
  name,
  photoURL,
  onFileSelect,
  uploading = false,
  label = 'Profile photo',
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} photoURL={photoURL} size="lg" />
      <div>
        <p className="label mb-1">{label}</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFileSelect(file)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-secondary text-sm disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : photoURL ? 'Change photo' : 'Upload photo'}
        </button>
        <p className="text-xs text-faded-grey mt-1">Max {MAX_PHOTO_MB}MB · JPG, PNG, WebP</p>
      </div>
    </div>
  )
}
