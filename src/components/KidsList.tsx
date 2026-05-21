import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ShareKidModal } from './ShareKidModal'

interface Kid {
  id: string
  name: string
  age: number
}

export function KidsList() {
  const [kids, setKids] = useState<Kid[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [shareKid, setShareKid] = useState<Kid | null>(null)
  const [formData, setFormData] = useState({ name: '', age: '' })

  useEffect(() => {
    fetchKids()
  }, [])

  async function fetchKids() {
    try {
      const { data, error } = await supabase
        .from('kids')
        .select('*')
        .order('name')

      if (error) throw error
      setKids(data || [])
    } catch (err) {
      console.error('Error fetching kids:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim()) return

    try {
      if (editingId) {
        const { error } = await supabase
          .from('kids')
          .update({ name: formData.name, age: parseInt(formData.age) || null })
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('kids')
          .insert([{ name: formData.name, age: parseInt(formData.age) || null }])

        if (error) throw error
      }

      setFormData({ name: '', age: '' })
      setEditingId(null)
      setShowForm(false)
      fetchKids()
    } catch (err) {
      console.error('Error saving kid:', err)
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from('kids').delete().eq('id', id)
      if (error) throw error
      fetchKids()
    } catch (err) {
      console.error('Error deleting kid:', err)
    }
  }

  function handleEdit(kid: Kid) {
    setEditingId(kid.id)
    setFormData({ name: kid.name, age: kid.age.toString() })
    setShowForm(true)
  }

  if (loading) return <div>Loading kids...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Kids</h2>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setFormData({ name: '', age: '' })
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? 'Cancel' : 'Add Kid'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow space-y-3">
          <input
            type="text"
            placeholder="Kid's name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            required
          />
          <input
            type="number"
            placeholder="Age"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          />
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
          >
            {editingId ? 'Update' : 'Add'}
          </button>
        </form>
      )}

      <div className="grid gap-3">
        {kids.map((kid) => (
          <div key={kid.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{kid.name}</h3>
              {kid.age && <p className="text-sm text-gray-600">Age: {kid.age}</p>}
            </div>
            <div className="space-x-2">
              <button
                onClick={() => setShareKid(kid)}
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
              >
                Share
              </button>
              <button
                onClick={() => handleEdit(kid)}
                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(kid.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {kids.length === 0 && !showForm && (
        <p className="text-gray-500 text-center py-8">No kids added yet. Click "Add Kid" to get started!</p>
      )}

      {shareKid && (
        <ShareKidModal
          kid={shareKid}
          onClose={() => setShareKid(null)}
          onShare={() => {
            setShareKid(null)
            fetchKids()
          }}
        />
      )}
    </div>
  )
}
