import { useState, useEffect } from 'react'
import { db, auth } from '../lib/firebase'
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { ShareKidModal } from './ShareKidModal'
import { Modal } from './Modal'
import { Avatar } from './Avatar'
import { PhotoUpload } from './PhotoUpload'
import { uploadProfilePhoto, kidPhotoPath, photoUploadSuccessMessage } from '../lib/storage'
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
        await addDoc(collection(db, 'kids'), {
          userId: auth.currentUser.uid,
          ...payload,
          createdAt: new Date(),
        })
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

  if (loading) return <div className="text-graphite-grey">Loading kids...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-charcoal-black">Kids</h2>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setFormData({ name: '', age: '', photoURL: '' })
          }}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : 'Add Kid'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-canvas-sand">
          <PhotoUpload
            name={formData.name || 'Kid'}
            photoURL={formData.photoURL || undefined}
            onFileSelect={(file) => handlePhotoUpload(file, editingId || undefined)}
            uploading={uploadingPhoto}
            label="Kid profile photo"
          />
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
          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : editingId ? 'Update' : 'Add'}
          </button>
        </form>
      )}

      <div className="grid gap-4">
        {kids.map((kid) => (
          <div key={kid.id} className="card p-4 flex justify-between items-center gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={kid.name} photoURL={kid.photoURL} size="md" />
              <div className="min-w-0">
                <h3 className="font-semibold text-charcoal-black">
                  {kid.name}
                </h3>
                {kid.age != null && (
                  <p className="text-sm text-graphite-grey">Age: {kid.age}</p>
                )}
              </div>
            </div>
            <div className="space-x-2 flex shrink-0">
              <button
                onClick={() => setShareKid(kid)}
                className="btn-secondary text-sm"
                title="Share this kid's activities with another parent"
              >
                Share
              </button>
              <button onClick={() => handleEdit(kid)} className="btn-secondary text-sm">
                Edit
              </button>
              <button
                onClick={() => setDeleteKid(kid)}
                disabled={deleting}
                className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {kids.length === 0 && !showForm && (
        <p className="text-graphite-grey text-center py-8">
          No kids added yet. Click &quot;Add Kid&quot; to get started!
        </p>
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
