import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { db, auth } from '../lib/firebase'
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { generateICS, downloadICS } from '../lib/ics'
import { Modal } from './Modal'
import { Avatar } from './Avatar'
import { SkeletonLoader } from './SkeletonLoader'
import { useToast } from '../lib/toast'
import type { Activity, Kid, Invitee } from '../lib/types'

interface Tag {
  id: string
  name: string
  color: string
}

function mergeActivities(owned: Activity[], shared: Activity[]): Activity[] {
  const map = new Map<string, Activity>()
  owned.forEach((a) => map.set(a.id, { ...a, shared: false }))
  shared.forEach((a) => map.set(a.id, { ...a, shared: true }))
  return Array.from(map.values()).sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
}

function getKidDisplay(
  activity: Activity,
  kids: Kid[]
): { id: string; name: string; photoURL?: string }[] {
  if (activity.kidsOnActivity?.length) {
    return activity.kidsOnActivity
  }
  return (activity.kidIds || [])
    .map((id) => kids.find((k) => k.id === id))
    .filter((k): k is Kid => !!k)
    .map((k) => ({ id: k.id, name: k.name, photoURL: k.photoURL }))
}

export function ActivitiesList({
  onActivitiesChange,
  onKidsChange,
  onTagsChange,
}: {
  onActivitiesChange?: (activities: Activity[]) => void
  onKidsChange?: (kids: Kid[]) => void
  onTagsChange?: (tags: Tag[]) => void
} = {}) {
  const { addToast } = useToast()
  const [ownedActivities, setOwnedActivities] = useState<Activity[]>([])
  const [sharedActivities, setSharedActivities] = useState<Activity[]>([])
  const activities = useMemo(
    () => mergeActivities(ownedActivities, sharedActivities),
    [ownedActivities, sharedActivities]
  )
  const lastSyncedActivities = useRef('')
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
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    dueDate: '',
    dueTime: '',
  })

  const isOwned = useCallback(
    (activity: Activity) => activity.userId === auth.currentUser?.uid && !activity.shared,
    []
  )

  useEffect(() => {
    const signature = activities.map((a) => a.id).join(',')
    if (signature === lastSyncedActivities.current) return
    lastSyncedActivities.current = signature
    onActivitiesChange?.(activities)
  }, [activities, onActivitiesChange])

  const lastSyncedKids = useRef('')
  useEffect(() => {
    const signature = kids.map((k) => k.id).join(',')
    if (signature === lastSyncedKids.current) return
    lastSyncedKids.current = signature
    onKidsChange?.(kids)
  }, [kids, onKidsChange])

  const lastSyncedTags = useRef('')
  useEffect(() => {
    const signature = tags.map((t) => t.id).join(',')
    if (signature === lastSyncedTags.current) return
    lastSyncedTags.current = signature
    onTagsChange?.(tags)
  }, [tags, onTagsChange])

  useEffect(() => {
    if (!auth.currentUser) return

    const uid = auth.currentUser.uid
    let ownedReady = false
    let sharedReady = false

    const kidsQuery = query(collection(db, 'kids'), where('userId', '==', uid))
    const kidsUnsub = onSnapshot(kidsQuery, (snapshot) => {
      setKids(
        snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          name: docSnap.data().name,
          photoURL: docSnap.data().photoURL,
        })) as Kid[]
      )
    })

    const tagsQuery = query(collection(db, 'tags'), where('userId', '==', uid))
    const tagsUnsub = onSnapshot(tagsQuery, (snapshot) => {
      setTags(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })) as Tag[])
    })

    const ownedQuery = query(collection(db, 'activities'), where('userId', '==', uid))
    const ownedUnsub = onSnapshot(ownedQuery, (snapshot) => {
      setOwnedActivities(
        snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
          notes: docSnap.data().notes || [],
          shared: false,
        })) as Activity[]
      )
      ownedReady = true
      if (sharedReady) setLoading(false)
    })

    const sharedQuery = query(
      collection(db, 'activities'),
      where('inviteeIds', 'array-contains', uid)
    )
    const sharedUnsub = onSnapshot(sharedQuery, (snapshot) => {
      setSharedActivities(
        snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
          notes: docSnap.data().notes || [],
          shared: true,
        })) as Activity[]
      )
      sharedReady = true
      if (ownedReady) setLoading(false)
    })

    return () => {
      kidsUnsub()
      tagsUnsub()
      ownedUnsub()
      sharedUnsub()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.title.trim() || selectedKids.length === 0 || !auth.currentUser || submitting) return

    setSubmitting(true)
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        location: formData.location.trim(),
        dueDate: formData.dueDate,
        dueTime: formData.dueTime,
        kidIds: selectedKids,
        tagIds: selectedTags,
      }

      if (editingId) {
        await updateDoc(doc(db, 'activities', editingId), payload)
        addToast({ message: 'Activity updated', type: 'success' })
      } else {
        await addDoc(collection(db, 'activities'), {
          userId: auth.currentUser.uid,
          ...payload,
          notes: [],
          inviteeIds: [],
          invitees: [],
          createdAt: new Date(),
        })
        addToast({ message: 'Activity created', type: 'success' })
      }

      resetForm()
    } catch (err) {
      addToast({ message: 'Error saving activity', type: 'error' })
      console.error('Error saving activity:', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAddNote(activityId: string) {
    if (!newNote.trim()) return
    const activity = activities.find((a) => a.id === activityId)
    if (!activity || !isOwned(activity)) return

    try {
      await updateDoc(doc(db, 'activities', activityId), {
        notes: [...(activity.notes || []), { id: Date.now().toString(), content: newNote }],
      })
      addToast({ message: 'Note added', type: 'success' })
      setNewNote('')
    } catch (err) {
      addToast({ message: 'Error adding note', type: 'error' })
      console.error('Error adding note:', err)
    }
  }

  async function handleDeleteNote(activityId: string, noteId: string) {
    const activity = activities.find((a) => a.id === activityId)
    if (!activity || !isOwned(activity)) return

    try {
      await updateDoc(doc(db, 'activities', activityId), {
        notes: activity.notes.filter((n) => n.id !== noteId),
      })
      addToast({ message: 'Note deleted', type: 'success' })
    } catch (err) {
      addToast({ message: 'Error deleting note', type: 'error' })
      console.error('Error deleting note:', err)
    }
  }

  async function handleDelete(id: string) {
    if (deleting) return
    setDeleting(true)
    try {
      await deleteDoc(doc(db, 'activities', id))
      addToast({ message: 'Activity deleted', type: 'success' })
      setDeleteActivityId(null)
    } catch (err) {
      addToast({ message: 'Error deleting activity', type: 'error' })
      console.error('Error deleting activity:', err)
    } finally {
      setDeleting(false)
    }
  }

  function handleEdit(activity: Activity) {
    if (!isOwned(activity)) return
    setEditingId(activity.id)
    setFormData({
      title: activity.title,
      description: activity.description || '',
      location: activity.location || '',
      dueDate: activity.dueDate || '',
      dueTime: activity.dueTime || '',
    })
    setSelectedKids(activity.kidIds || [])
    setSelectedTags(activity.tagIds || [])
    setShowForm(true)
  }

  function handleExport() {
    const owned = activities.filter((a) => isOwned(a))
    const ics = generateICS(owned, kids)
    downloadICS(ics, `activities-${new Date().toISOString().split('T')[0]}.ics`)
    addToast({ message: 'Calendar exported', type: 'success' })
  }

  function resetForm() {
    setFormData({ title: '', description: '', location: '', dueDate: '', dueTime: '' })
    setSelectedKids([])
    setSelectedTags([])
    setEditingId(null)
    setShowForm(false)
  }

  if (loading) return <SkeletonLoader count={5} height="140px" className="space-y-4" />

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-charcoal-black">Activities</h2>
        <div className="space-x-2 flex flex-wrap">
          {ownedActivities.length > 0 && (
            <button onClick={handleExport} className="btn-primary text-sm px-3 py-2">
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

      {sharedActivities.length > 0 && (
        <p className="text-sm text-graphite-grey">
          {sharedActivities.length} shared{' '}
          {sharedActivities.length === 1 ? 'activity' : 'activities'} from other parents
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-canvas-sand"
        >
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
          <div>
            <label className="label">Location</label>
            <input
              type="text"
              placeholder="e.g. Lincoln Elementary, 123 Main St"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="input"
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
                <label key={kid.id} className="flex items-center cursor-pointer gap-2">
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
                    className="w-4 h-4"
                  />
                  <Avatar name={kid.name} photoURL={kid.photoURL} size="sm" />
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
            disabled={submitting}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : editingId ? 'Update' : 'Add'}
          </button>
        </form>
      )}

      <div className="grid gap-4">
        {activities.map((activity) => {
          const owned = isOwned(activity)
          const kidDisplay = getKidDisplay(activity, kids)
          const invitees = (activity.invitees || []) as Invitee[]

          return (
            <div key={activity.id} className="card p-4">
              <div className="flex justify-between items-start mb-3 gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg text-charcoal-black">
                      {activity.title}
                    </h3>
                    {activity.shared && (
                      <span className="ph-badge-shared">Shared with you</span>
                    )}
                  </div>
                  {activity.description && (
                    <p className="text-sm text-graphite-grey">{activity.description}</p>
                  )}
                  {activity.location && (
                    <p className="text-sm text-graphite-grey mt-1">📍 {activity.location}</p>
                  )}
                </div>
                {owned && (
                  <div className="space-x-2 flex shrink-0">
                    <button onClick={() => handleEdit(activity)} className="btn-secondary text-sm">
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteActivityId(activity.id)}
                      className="btn-secondary text-sm"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <div className="text-sm text-graphite-grey mb-2">
                {activity.dueDate && <span>{activity.dueDate}</span>}
                {activity.dueTime && <span> at {activity.dueTime}</span>}
              </div>
              <div className="mt-2 text-sm mb-2">
                <span className="font-medium text-charcoal-black">Kids: </span>
                {kidDisplay.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {kidDisplay.map((kid) => (
                      <div key={kid.id} className="flex items-center gap-1.5">
                        <Avatar name={kid.name} photoURL={kid.photoURL} size="sm" />
                        <span className="text-graphite-grey">{kid.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-graphite-grey">No kids assigned</span>
                )}
              </div>
              {invitees.length > 0 && (
                <div className="text-sm mb-2">
                  <span className="font-medium text-charcoal-black">
                    Invitees:{' '}
                  </span>
                  <span className="text-graphite-grey">
                    {invitees.map((i) => i.email || i.displayName || i.userId).join(', ')}
                  </span>
                </div>
              )}
              {activity.tagIds?.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                  {activity.tagIds.map((tagId) => {
                    const tag = tags.find((t) => t.id === tagId)
                    return tag ? (
                      <span
                        key={tag.id}
                        className="px-2 py-1 rounded text-xs text-ink-black"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ) : null
                  })}
                </div>
              )}
              <button
                onClick={() =>
                  setExpandedActivity(expandedActivity === activity.id ? null : activity.id)
                }
                className="text-sky-blue text-sm hover:underline font-medium"
              >
                {expandedActivity === activity.id ? 'Hide' : 'Show'} Notes ({activity.notes?.length || 0})
              </button>
              {expandedActivity === activity.id && (
                <div className="mt-3 space-y-2 border-t border-pale-granite">
                  {(activity.notes || []).map((note) => (
                    <div
                      key={note.id}
                      className="bg-canvas-sand"
                    >
                      <p className="text-sm text-charcoal-black">{note.content}</p>
                      {owned && (
                        <button
                          onClick={() => handleDeleteNote(activity.id, note.id)}
                          className="text-sunset-orange text-xs hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                  {owned && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="flex-1 px-2 py-1 border border-graphite-grey rounded text-sm bg-surface-white"
                      />
                      <button onClick={() => handleAddNote(activity.id)} className="btn-primary text-sm">
                        Add
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {activities.length === 0 && !showForm && (
        <p className="text-graphite-grey text-center py-8">
          No activities yet. Click &quot;Add&quot; to get started!
        </p>
      )}

      <Modal
        isOpen={!!deleteActivityId}
        title="Delete Activity"
        onClose={() => !deleting && setDeleteActivityId(null)}
        actions={[
          {
            label: deleting ? 'Deleting...' : 'Delete',
            onClick: () => deleteActivityId && handleDelete(deleteActivityId),
            variant: 'primary',
            disabled: deleting,
          },
        ]}
      >
        <p className="text-graphite-grey">Are you sure you want to delete this activity?</p>
      </Modal>
    </div>
  )
}
