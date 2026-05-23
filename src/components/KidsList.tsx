import { useState, useEffect } from 'react'
import { db, auth } from '../lib/firebase'
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { ShareKidModal } from './ShareKidModal'
import { Modal } from './Modal'
import { Avatar } from './Avatar'
import { EmptyState } from './EmptyState'
import { PhotoUpload } from './PhotoUpload'
import { SkeletonLoader } from './SkeletonLoader'
import { uploadProfilePhoto, kidPhotoPath, photoUploadSuccessMessage } from '../lib/storage'
import { saveKidsToCache } from '../lib/offlineCache'
import { useToast } from '../lib/toast'
import type { Kid } from '../lib/types'

export function KidsList() {
  const { addToast } = useToast()
  const [kids, setKids] = useState<Kid[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [shareKid, setShareKid] = useState<Kid | null>(null)
  const [deleteKid, setDeleteKid] = useState<Kid | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [formData, setFormData] = useState({ name: '', age: '', photoURL: '' })

  useEffect(() => {
    if (!auth.currentUser) return

    const q = query(collection(db, 'kids'), where('userId', '==', auth.currentUser.uid))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Kid[]
      setKids(data.sort((a, b) => a.name.localeCompare(b.name)))
      setLoading(false)
    })

    return unsubscribe
  }, [])

  async function handlePhotoUpload(file: File, kidId?: string) {
    if (!auth.currentUser) return
    setUploadingPhoto(true)
    try {
      const pathKidId = kidId || 'new'
      const result = await uploadProfilePhoto(
        `${kidPhotoPath(auth.currentUser.uid, pathKidId)}_${Date.now()}`,
        file
      )
      setFormData((prev) => ({ ...prev, photoURL: result.url }))
      if (kidId) {
        await updateDoc(doc(db, 'kids', kidId), { photoURL: result.url })
        addToast({
          message: photoUploadSuccessMessage(result, 'Kid photo'),
          type: 'success',
        })
      }
    } catch (err: unknown) {
      addToast({
        message: err instanceof Error ? err.message : 'Failed to upload photo',
        type: 'error',
      })
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim() || !auth.currentUser || submitting) return

    setSubmitting(true)
    try {
      const payload = {
        name: formData.name,
        age: parseInt(formData.age) || null,
        photoURL: formData.photoURL || '',
      }

      if (editingId) {
        await updateDoc(doc(db, 'kids', editingId), payload)
        addToast({ message: `${formData.name} updated`, type: 'success' })
      } else {
        const docRef = await addDoc(collection(db, 'kids'), {
          userId: auth.currentUser.uid,
          ...payload,
          createdAt: new Date(),
        })
        // Save to IndexedDB for offline access
        await saveKidsToCache([{
          id: docRef.id,
          userId: auth.currentUser.uid,
          ...payload,
          createdAt: new Date(),
        }]).catch(err => console.error('Failed to cache kid:', err))
        addToast({ message: `${formData.name} added`, type: 'success' })
      }

      setFormData({ name: '', age: '', photoURL: '' })
      setEditingId(null)
      setShowForm(false)
    } catch (err) {
      addToast({ message: 'Error saving kid', type: 'error' })
      console.error('Error saving kid:', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (deleting) return
    setDeleting(true)
    try {
      await deleteDoc(doc(db, 'kids', id))
      addToast({ message: 'Kid deleted', type: 'success' })
      setDeleteKid(null)
    } catch (err) {
      addToast({ message: 'Error deleting kid', type: 'error' })
      console.error('Error deleting kid:', err)
    } finally {
      setDeleting(false)
    }
  }

  function handleEdit(kid: Kid) {
    setEditingId(kid.id)
    setFormData({
      name: kid.name,
      age: kid.age?.toString() || '',
      photoURL: kid.photoURL || '',
    })
    setShowForm(true)
  }

  if (loading) return <SkeletonLoader count={3} height="120px" className="space-y-4" />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-charcoal-black">Kids</h2>
            <span className="inline-flex items-center rounded-full bg-warm-gray-tint px-3 py-1 text-sm text-charcoal-black">
              {kids.length} {kids.length === 1 ? 'profile' : 'profiles'}
            </span>
          </div>
          <p className="text-sm text-graphite-grey mt-2 max-w-2xl">
            Add each child and manage shared activities, photos, and parent connections in one place.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setFormData({ name: '', age: '', photoURL: '' })
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          {showForm ? 'Cancel' : '+ Add Kid'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-surface-white border border-pale-granite shadow-sm rounded-2xl p-6">
          <PhotoUpload
            name={formData.name || 'Kid'}
            photoURL={formData.photoURL || undefined}
            onFileSelect={(file) => handlePhotoUpload(file, editingId || undefined)}
            uploading={uploadingPhoto}
            label="Kid profile photo"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Kid&apos;s Name</label>
              <input
                type="text"
                placeholder="Enter name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Age</label>
              <input
                type="number"
                placeholder="Enter age"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : editingId ? 'Update kid' : 'Add kid'}
          </button>
        </form>
      )}

      {kids.length === 0 && !showForm ? (
        <EmptyState
          icon="👨‍👩‍👧‍👦"
          title="No kids added yet"
          description="Create a child profile to start assigning activities and sharing schedules with your family."
          action={{ label: 'Add your first kid', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="grid gap-4">
          {kids.map((kid) => (
            <div key={kid.id} className="card group p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar name={kid.name} photoURL={kid.photoURL} size="md" />
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-charcoal-black truncate">
                      {kid.name}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-sm">
                      {kid.age != null && (
                        <span className="rounded-full bg-warm-gray-tint px-3 py-1 text-charcoal-black">
                          Age {kid.age}
                        </span>
                      )}
                      <span className="rounded-full bg-pale-granite px-3 py-1 text-graphite-grey">
                        {kid.photoURL ? 'Photo uploaded' : 'No photo yet'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShareKid(kid)}
                    className="btn-secondary text-sm"
                    title="Share this kid's activities with another parent"
                  >
                    🤝 Share
                  </button>
                  <button onClick={() => handleEdit(kid)} className="btn-secondary text-sm">
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => setDeleteKid(kid)}
                    disabled={deleting}
                    className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? 'Deleting...' : '🗑️ Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {shareKid && (
        <ShareKidModal
          kid={shareKid}
          onClose={() => setShareKid(null)}
          onShare={() => setShareKid(null)}
        />
      )}

      <Modal
        isOpen={!!deleteKid}
        title="Delete Kid"
        onClose={() => !deleting && setDeleteKid(null)}
        actions={[
          {
            label: deleting ? 'Deleting...' : 'Delete',
            onClick: () => deleteKid && handleDelete(deleteKid.id),
            variant: 'primary',
            disabled: deleting,
          },
        ]}
      >
        <p className="text-graphite-grey">Are you sure you want to delete {deleteKid?.name}?</p>
      </Modal>
    </div>
  )
}
