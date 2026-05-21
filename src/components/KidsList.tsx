import { useState, useEffect } from 'react'
import { db, auth } from '../lib/firebase'
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { ShareKidModal } from './ShareKidModal'
import { useToast } from '../lib/toast'

interface Kid {
  id: string
  name: string
  age: number
}

export function KidsList() {
  const { addToast } = useToast()
  const [kids, setKids] = useState<Kid[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [shareKid, setShareKid] = useState<Kid | null>(null)
  const [formData, setFormData] = useState({ name: '', age: '' })

  useEffect(() => {
    if (!auth.currentUser) return

    const q = query(collection(db, 'kids'), where('userId', '==', auth.currentUser.uid))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Kid[]
      setKids(data.sort((a, b) => a.name.localeCompare(b.name)))
      setLoading(false)
    })

    return unsubscribe
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim() || !auth.currentUser) return

    try {
      if (editingId) {
        await updateDoc(doc(db, 'kids', editingId), {
          name: formData.name,
          age: parseInt(formData.age) || null,
        })
        addToast(`${formData.name} updated`, 'success')
      } else {
        await addDoc(collection(db, 'kids'), {
          userId: auth.currentUser.uid,
          name: formData.name,
          age: parseInt(formData.age) || null,
          createdAt: new Date(),
        })
        addToast(`${formData.name} added`, 'success')
      }

      setFormData({ name: '', age: '' })
      setEditingId(null)
      setShowForm(false)
    } catch (err) {
      addToast('Error saving kid', 'error')
      console.error('Error saving kid:', err)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDoc(doc(db, 'kids', id))
      addToast('Kid deleted', 'success')
    } catch (err) {
      addToast('Error deleting kid', 'error')
      console.error('Error deleting kid:', err)
    }
  }

  function handleEdit(kid: Kid) {
    setEditingId(kid.id)
    setFormData({ name: kid.name, age: kid.age.toString() })
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
            setFormData({ name: '', age: '' })
          }}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : 'Add Kid'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-canvas-sand p-6 rounded-md border border-pale-granite space-y-4">
          <div>
            <label className="label">Kid's Name</label>
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
            className="w-full btn-primary"
          >
            {editingId ? 'Update' : 'Add'}
          </button>
        </form>
      )}

      <div className="grid gap-4">
        {kids.map((kid) => (
          <div key={kid.id} className="card p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-charcoal-black">{kid.name}</h3>
              {kid.age && <p className="text-sm text-graphite-grey">Age: {kid.age}</p>}
            </div>
            <div className="space-x-2 flex">
              <button
                onClick={() => setShareKid(kid)}
                className="btn-secondary text-sm"
              >
                Share
              </button>
              <button
                onClick={() => handleEdit(kid)}
                className="btn-secondary text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(kid.id)}
                className="btn-secondary text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {kids.length === 0 && !showForm && (
        <p className="text-graphite-grey text-center py-8">No kids added yet. Click "Add Kid" to get started!</p>
      )}

      {shareKid && (
        <ShareKidModal
          kid={shareKid}
          onClose={() => setShareKid(null)}
          onShare={() => setShareKid(null)}
        />
      )}
    </div>
  )
}
