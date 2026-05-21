import { useState, useEffect } from 'react'
import { db, auth } from '../lib/firebase'
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { generateICS, downloadICS } from '../lib/ics'
import { Modal } from './Modal'
import { useToast } from '../lib/toast'

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
  const { addToast } = useToast()
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
  const [deleteActivityId, setDeleteActivityId] = useState<string | null>(null)
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
        addToast('Activity updated', 'success')
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
        addToast('Activity created', 'success')
      }

      resetForm()
    } catch (err) {
      addToast('Error saving activity', 'error')
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
      addToast('Note added', 'success')
      setNewNote('')
    } catch (err) {
      addToast('Error adding note', 'error')
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
      addToast('Note deleted', 'success')
    } catch (err) {
      addToast('Error deleting note', 'error')
      console.error('Error deleting note:', err)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDoc(doc(db, 'activities', id))
      addToast('Activity deleted', 'success')
      setDeleteActivityId(null)
    } catch (err) {
      addToast('Error deleting activity', 'error')
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
    addToast('Calendar exported', 'success')
  }

  function resetForm() {
    setFormData({ title: '', description: '', dueDate: '', dueTime: '' })
    setSelectedKids([])
    setSelectedTags([])
    setEditingId(null)
    setShowForm(false)
  }

  if (loading) return <div className="text-graphite-grey">Loading activities...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-charcoal-black">Activities</h2>
        <div className="space-x-2 flex flex-wrap">
          {activities.length > 0 && (
            <button
              onClick={handleExport}
              className="btn-primary text-sm px-3 py-2"
            >
              Export
            </button>
          )}
          <button
            onClick={() => {
              if (showForm) resetForm()
              else setShowForm(true)
            }}
            className="btn-primary text-sm px-3 py-2"
          >
            {showForm ? 'Cancel' : 'Add'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-canvas-sand p-6 rounded-md border border-pale-granite space-y-4">
          <div>
            <label className="label">Activity Title</label>
            <input
              type="text"
              placeholder="Enter activity title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              placeholder="Enter description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Due Time</label>
              <input
                type="time"
                value={formData.dueTime}
                onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="label">Select Kids</label>
            <div className="space-y-2">
              {kids.map((kid) => (
                <label key={kid.id} className="flex items-center cursor-pointer">
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
                    className="mr-2 w-4 h-4"
                  />
                  <span className="text-charcoal-black">{kid.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Tags</label>
            <div className="space-y-2">
              {tags.map((tag) => (
                <label key={tag.id} className="flex items-center cursor-pointer">
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
                    className="mr-2 w-4 h-4"
                  />
                  <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: tag.color }} />
                  <span className="text-charcoal-black">{tag.name}</span>
                </label>
              ))}
            </div>
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
        {activities.map((activity) => (
          <div key={activity.id} className="card p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-charcoal-black">{activity.title}</h3>
                {activity.description && <p className="text-sm text-graphite-grey">{activity.description}</p>}
              </div>
              <div className="space-x-2 flex">
                <button
                  onClick={() => handleEdit(activity)}
                  className="btn-secondary text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteActivityId(activity.id)}
                  className="btn-secondary text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="text-sm text-graphite-grey mb-2">
              {activity.dueDate && <span>{activity.dueDate}</span>}
              {activity.dueTime && <span> at {activity.dueTime}</span>}
            </div>
            <div className="mt-2 text-sm mb-2">
              <span className="font-medium text-charcoal-black">Kids: </span>
              <span className="text-graphite-grey">
                {activity.kidIds.length > 0
                  ? activity.kidIds
                      .map((id) => kids.find((k) => k.id === id)?.name)
                      .filter(Boolean)
                      .join(', ')
                  : 'No kids assigned'}
              </span>
            </div>
            {activity.tagIds.length > 0 && (
              <div className="flex gap-2 mb-2">
                {activity.tagIds.map((tagId) => {
                  const tag = tags.find((t) => t.id === tagId)
                  return tag ? (
                    <span key={tag.id} className="px-2 py-1 rounded text-xs text-ink-black" style={{ backgroundColor: tag.color }}>
                      {tag.name}
                    </span>
                  ) : null
                })}
              </div>
            )}
            <button
              onClick={() => setExpandedActivity(expandedActivity === activity.id ? null : activity.id)}
              className="text-sky-blue text-sm hover:underline font-medium"
            >
              {expandedActivity === activity.id ? 'Hide' : 'Show'} Notes ({activity.notes.length})
            </button>
            {expandedActivity === activity.id && (
              <div className="mt-3 space-y-2 border-t border-pale-granite pt-3">
                {activity.notes.map((note) => (
                  <div key={note.id} className="bg-canvas-sand p-2 rounded flex justify-between items-start">
                    <p className="text-sm text-charcoal-black">{note.content}</p>
                    <button
                      onClick={() => handleDeleteNote(activity.id, note.id)}
                      className="text-sunset-orange text-xs hover:underline"
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
                    className="flex-1 px-2 py-1 border border-graphite-grey rounded text-sm bg-surface-white text-charcoal-black"
                  />
                  <button
                    onClick={() => handleAddNote(activity.id)}
                    className="btn-primary text-sm"
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
        <p className="text-graphite-grey text-center py-8">No activities yet. Click "Add Activity" to get started!</p>
      )}

      <Modal
        isOpen={!!deleteActivityId}
        title="Delete Activity"
        onClose={() => setDeleteActivityId(null)}
        actions={[
          {
            label: 'Delete',
            onClick: () => deleteActivityId && handleDelete(deleteActivityId),
            variant: 'primary',
          },
        ]}
      >
        <p className="text-graphite-grey">Are you sure you want to delete this activity?</p>
      </Modal>
    </div>
  )
}
