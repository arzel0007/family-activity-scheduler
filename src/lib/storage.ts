import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

/** Max upload file size (8 MB). Images are compressed before saving. */
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024
export const MAX_PHOTO_MB = 8
const MAX_DIMENSION = 1024

export type PhotoUploadResult = {
  url: string
  storage: 'firebase' | 'inline'
  /** True when Firebase Storage was enabled but failed; saved inline instead. */
  usedFallback?: boolean
}

/** After a failed Storage upload, skip further attempts this session (avoids CORS retry spam). */
let storageUnavailableForSession = false

/** Only call Firebase Storage when explicitly enabled (bucket must exist in Firebase Console). */
export function isFirebaseStorageEnabled(): boolean {
  if (storageUnavailableForSession) return false
  return import.meta.env.VITE_FIREBASE_STORAGE === 'true'
}

function markStorageUnavailable() {
  storageUnavailableForSession = true
}

function isStorageError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return true
  const code = String((error as { code?: string }).code || '')
  const message = String((error as { message?: string }).message || error).toLowerCase()
  return (
    code.startsWith('storage/') ||
    message.includes('cors') ||
    message.includes('network') ||
    message.includes('err_failed') ||
    message.includes('failed to fetch')
  )
}

async function resizeImage(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = url
    })

    let { width, height } = img
    if (width > height && width > MAX_DIMENSION) {
      height = Math.round((height * MAX_DIMENSION) / width)
      width = MAX_DIMENSION
    } else if (height >= width && height > MAX_DIMENSION) {
      width = Math.round((width * MAX_DIMENSION) / height)
      height = MAX_DIMENSION
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d')?.drawImage(img, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.85)
    )
    if (!blob) throw new Error('Could not process image')
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function saveInlinePhoto(file: File): Promise<string> {
  const blob = await resizeImage(file)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read image'))
    reader.readAsDataURL(blob)
  })
}

async function saveToFirebaseStorage(path: string, file: File): Promise<string> {
  const blob = await resizeImage(file)
  const storageRef = ref(storage, `${path}.jpg`)
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
  return getDownloadURL(storageRef)
}

export async function uploadProfilePhoto(path: string, file: File): Promise<PhotoUploadResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file')
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error(`Image must be under ${MAX_PHOTO_MB}MB`)
  }

  // Default: store in Firestore as data URL (no Storage API / no CORS noise in dev)
  if (!isFirebaseStorageEnabled()) {
    const url = await saveInlinePhoto(file)
    return { url, storage: 'inline' }
  }

  try {
    const url = await saveToFirebaseStorage(path, file)
    return { url, storage: 'firebase' }
  } catch (error) {
    if (!isStorageError(error)) throw error

    markStorageUnavailable()
    const url = await saveInlinePhoto(file)
    return { url, storage: 'inline', usedFallback: true }
  }
}

export function photoUploadSuccessMessage(
  result: PhotoUploadResult,
  label: string
): string {
  if (result.storage === 'firebase') return `${label} updated`
  if (result.usedFallback) {
    return `${label} saved (Firebase Storage unavailable — stored in database)`
  }
  return `${label} saved`
}

export function parentPhotoPath(userId: string) {
  return `profilePhotos/${userId}/avatar`
}

export function kidPhotoPath(userId: string, kidId: string) {
  return `profilePhotos/${userId}/kids/${kidId}`
}
