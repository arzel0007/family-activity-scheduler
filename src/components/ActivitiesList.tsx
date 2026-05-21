import { useState, useEffect } from 'react'
import { db, auth } from '../lib/firebase'
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { generateICS, downloadICS } from '../lib/ics'

interface Kid {
  id: string
  name: string
}

interface Tag {
  id: string
  name: string
  color: string
}

interface Note {
  id: string
  content: string
}

interface Activity {
  id: string
  title: string
  description: string
  dueDate: string
  dueTime: string
  kidIds: string[]
  tagIds: string[]
  notes: Note[]
}

export function ActivitiesList() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [kids, setKids] = useState<Kid[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedKids, setSelectedKids] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null)
  const [newNote, setNewNote] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    dueTime: '',
  })

  useEffect(() => {
    if (!auth.currentUser) return

    // Fetch kids
    const kidsQuery = query(collection(db, 'kids'), where('userId', '==', auth.currentUser.uid))
    const kidsUnsub = onSnapshot(kidsQuery, (snapshot) => {
      setKids(snapshot.docs.map((doc) => ({ id: doc.id, name: doc.data().name })))
    })

    // Fetch tags
    const tagsQuery = query(collection(db, 'tags'), where('userId', '==', auth.currentUser.uid))
    const tagsUnsub = onSnapshot(tagsQuery, (snapshot) => {
      setTags(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Tag[])
    })

    // Fetch activities
    const activitiesQuery = query(collection(db, 'activities'), where('userId', '==', auth.currentUser.uid))
    const activitiesUnsub = onSnapshot(activitiesQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        notes: doc.data().notes || [],
      })) as Activity[]
      setActivities(data.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '')))
      setLoading(false)
    })

    return () => {
      kidsUnsub()
      tagsUnsub()
      activitiesUnsub()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.title.trim() || selectedKids.length === 0 || !auth.currentUser) return

    try {
      if (editingId) {
        await updateDoc(doc(db, 'activities', editingId), {
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate,
          dueTime: formData.dueTime,
          kidIds: selectedKids,
          tagIds: selectedTags,
        })
      } else {
        await addDoc(collection(db, 'activities'), {
          userId: auth.currentUser.uid,
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate,
          dueTime: formData.dueTime,
          kidIds: selectedKids,
          tagIds: selectedTags,
          notes: [],
          createdAt: new Date(),
        })
      }

      resetForm()
    } catch (err) {
      console.error('Error saving activity:', err)
    }
  }

  async function handleAddNote(activityId: string) {
    if (!newNote.trim()) return
    try {
      const activity = activities.find((a) => a.id === activityId)
      if (!activity) return

      await updateDoc(doc(db, 'activities', activityId), {
        notes: [...(activity.notes || []), { id: Date.now().toString(), content: newNote }],
      })
      setNewNote('')
    } catch (err) {
      console.error('Error adding note:', err)
    }
  }

  async function handleDeleteNote(activityId: string, noteId: string) {
    try {
      const activity = activities.find((a) => a.id === activityId)
      if (!activity) return

      await updateDoc(doc(db, 'activities', activityId), {
        notes: activity.notes.filter((n) => n.id !== noteId),
      })
    } catch (err) {
      console.error('Error deleting note:', err)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDoc(doc(db, 'activities', id))
    } catch (err) {
      console.error('Error deleting activity:', err)
    }
  }

  function handleEdit(activity: Activity) {
    setEditingId(activity.id)
    setFormData({
      title: activity.title,
      description: activity.description || '',
      dueDate: activity.dueDate || '',
      dueTime: activity.dueTime || '',
    })
    setSelectedKids(activity.kidIds || [])
    setSelectedTags(activity.tagIds || [])
    setShowForm(true)
  }

  function handleExport() {
    const exportActivities = activities.map((a) => ({
      ...a,
      activity_kids: a.kidIds.map((id) => ({ kid_id: id })),
    }))
    const ics = generateICS(exportActivities, kids)
    downloadICS(ics, `activities-${new Date().toISOString().split('T')[0]}.ics`)
  }

  function resetForm() {
    setFormData({ title: '', description: '', dueDate: '', dueTime: '' })
    setSelectedKids([])
    setSelectedTags([])
    setEditingId(null)
    setShowForm(false)
  }

  if (loading) return <div>Loading activities...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Activities</h2>
        <div className="space-x-2">
          {activities.length > 0 && (
            <button
              onClick={handleExport}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Export to Calendar
            </button>
          )}
          <button
            onClick={() => {
              if (showForm) resetForm()
              else setShowForm(true)
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {showForm ? 'Cancel' : 'Add Activity'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow space-y-3">
          <input
            type="text"
            placeholder="Activity title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            required
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="px-3 py-2 border rounded"
            />
            <input
              type="time"
              value={formData.dueTime}
              onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
              className="px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Select Kids</label>
            <div className="space-y-2">
              {kids.map((kid) => (
                <label key={kid.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedKids.includes(kid.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedKids([...selectedKids, kid.id])
                      } else {
                        setSelectedKids(selectedKids.filter((id) => id !== kid.id))
                      }
                    }}
                    className="mr-2"
                  />
                  {kid.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="space-y-2">
              {tags.map((tag) => (
                <label key={tag.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTags([...selectedTags, tag.id])
                      } else {
                        setSelectedTags(selectedTags.filter((id) => id !== tag.id))
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: tag.color }} />
                  {tag.name}
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
          >
            {editingId ? 'Update' : 'Add'}
          </button>
        </form>
      )}

      <div className="grid gap-3">
        {activities.map((activity) => (
          <div key={activity.id} className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{activity.title}</h3>
                {activity.description && <p className="text-sm text-gray-600">{activity.description}</p>}
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => handleEdit(activity)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(activity.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-500 mb-2">
              {activity.dueDate && <span>{activity.dueDate}</span>}
              {activity.dueTime && <span> at {activity.dueTime}</span>}
            </div>
            <div className="mt-2 text-sm mb-2">
              <span className="font-medium">Kids: </span>
              {activity.kidIds.length > 0
                ? activity.kidIds
                    .map((id) => kids.find((k) => k.id === id)?.name)
                    .filter(Boolean)
                    .join(', ')
                : 'No kids assigned'}
            </div>
            {activity.tagIds.length > 0 && (
              <div className="flex gap-2 mb-2">
                {activity.tagIds.map((tagId) => {
                  const tag = tags.find((t) => t.id === tagId)
                  return tag ? (
                    <span key={tag.id} className="px-2 py-1 rounded text-xs text-white" style={{ backgroundColor: tag.color }}>
                      {tag.name}
                    </span>
                  ) : null
                })}
              </div>
            )}
            <button
              onClick={() => setExpandedActivity(expandedActivity === activity.id ? null : activity.id)}
              className="text-blue-500 text-sm hover:underline"
            >
              {expandedActivity === activity.id ? 'Hide' : 'Show'} Notes ({activity.notes.length})
            </button>
            {expandedActivity === activity.id && (
              <div className="mt-3 space-y-2 border-t pt-3">
                {activity.notes.map((note) => (
                  <div key={note.id} className="bg-gray-50 p-2 rounded flex justify-between items-start">
                    <p className="text-sm">{note.content}</p>
                    <button
                      onClick={() => handleDeleteNote(activity.id, note.id)}
                      className="text-red-500 text-xs hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded text-sm"
                  />
                  <button
                    onClick={() => handleAddNote(activity.id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {activities.length === 0 && !showForm && (
        <p className="text-gray-500 text-center py-8">No activities yet. Click "Add Activity" to get started!</p>
      )}
    </div>
  )
}
