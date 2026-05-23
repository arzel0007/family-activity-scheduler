import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { db, auth } from '../lib/firebase'
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { generateICS, downloadICS } from '../lib/ics'
import { Modal } from './Modal'
import { Avatar } from './Avatar'
import { EmptyState } from './EmptyState'
import { SkeletonLoader } from './SkeletonLoader'
import { useToast } from '../lib/toast'
import type { Activity, ActivityType, Kid, Invitee } from '../lib/types'

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
    activityType: 'other' as ActivityType,
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
      activityType: activity.activityType || 'other',
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

  function handleExportActivity(activity: Activity) {
    const ics = generateICS([activity], kids)
    downloadICS(ics, `${activity.title.replace(/\s+/g, '-')}-${activity.dueDate || 'unscheduled'}.ics`)
    addToast({ message: `"${activity.title}" added to calendar`, type: 'success' })
    
    // Notify invitees that activity was added to calendar
    if (activity.invitees && activity.invitees.length > 0) {
      import('../lib/notifications').then(({ notifyInvitees }) => {
        notifyInvitees(activity.invitees, activity.title, 'added-to-calendar')
      })
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      description: '',
      location: '',
      dueDate: '',
      dueTime: '',
      activityType: 'other',
    })
    setSelectedKids([])
    setSelectedTags([])
    setEditingId(null)
    setShowForm(false)
  }

  if (loading) return <SkeletonLoader count={5} height="140px" className="space-y-4" />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-charcoal-black">Activities</h2>
            <span className="inline-flex items-center rounded-full bg-warm-gray-tint px-3 py-1 text-sm text-charcoal-black">
              {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
            </span>
          </div>
          <p className="text-sm text-graphite-grey mt-2 max-w-2xl">
            Create shared family activities, track notes, and keep your household on the same page.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ownedActivities.length > 0 && (
            <button onClick={handleExport} className="btn-secondary text-sm px-3 py-2">
              📅 Export
            </button>
          )}
          <button
            onClick={() => {
              if (showForm) resetForm()
              else setShowForm(true)
            }}
            className="btn-primary text-sm px-3 py-2"
          >
            {showForm ? 'Cancel' : '+ Add activity'}
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
          className="space-y-6 bg-surface-white border border-pale-granite shadow-sm rounded-3xl p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
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
              <label className="label">Location</label>
              <input
                type="text"
                placeholder="e.g. Lincoln Elementary, 123 Main St"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              placeholder="Enter description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={4}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Select Kids</label>
              <div className="space-y-2">
                {kids.map((kid) => (
                  <label key={kid.id} className="flex items-center gap-2 cursor-pointer rounded-xl border border-pale-granite p-3 transition-colors hover:bg-canvas-sand">
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
                  <label key={tag.id} className="flex items-center gap-2 cursor-pointer rounded-xl border border-pale-granite p-3 transition-colors hover:bg-canvas-sand">
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
                      className="w-4 h-4"
                    />
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="text-charcoal-black">{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : editingId ? 'Update activity' : 'Add activity'}
          </button>
        </form>
      )}

      <div className="grid gap-4">
        {activities.map((activity) => {
          const owned = isOwned(activity)
          const kidDisplay = getKidDisplay(activity, kids)
          const invitees = (activity.invitees || []) as Invitee[]

          return (
            <div key={activity.id} className="card p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-lg text-charcoal-black">{activity.title}</h3>
                    {activity.shared && <span className="ph-badge-shared">Shared</span>}
                    {invitees.length > 0 && (
                      <span className="ph-badge-invitee">{invitees.length} invitee{invitees.length === 1 ? '' : 's'}</span>
                    )}
                  </div>
                  {activity.description && (
                    <p className="text-sm text-graphite-grey mt-2">{activity.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    {activity.location && (
                      <span className="rounded-full bg-pale-granite px-3 py-1 text-graphite-grey">📍 {activity.location}</span>
                    )}
                    {(activity.dueDate || activity.dueTime) && (
                      <span className="rounded-full bg-warm-gray-tint px-3 py-1 text-charcoal-black">
                        {activity.dueDate || 'No date'}{activity.dueTime ? ` • ${activity.dueTime}` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {owned && (
                    <>
                      <button onClick={() => handleEdit(activity)} className="btn-secondary text-sm">
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => setDeleteActivityId(activity.id)}
                        className="btn-secondary text-sm"
                      >
                        🗑️ Delete
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleExportActivity(activity)}
                    className="btn-secondary text-sm"
                    title="Add to calendar"
                  >
                    📅
                  </button>
                </div>
              </div>

              <div className="mt-4 text-sm mb-4">
                <span className="font-medium text-charcoal-black">Kids:</span>
                {kidDisplay.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {kidDisplay.map((kid) => (
                      <div key={kid.id} className="flex items-center gap-2 rounded-full bg-canvas-sand px-3 py-2">
                        <Avatar name={kid.name} photoURL={kid.photoURL} size="sm" />
                        <span className="text-graphite-grey">{kid.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-graphite-grey ml-2">No kids assigned</span>
                )}
              </div>

              {activity.tagIds?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {activity.tagIds.map((tagId) => {
                    const tag = tags.find((t) => t.id === tagId)
                    return tag ? (
                      <span
                        key={tag.id}
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: tag.color, color: '#111827' }}
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
                <div className="mt-4 space-y-3 border-t border-pale-granite pt-4">
                  {(activity.notes || []).map((note) => (
                    <div key={note.id} className="rounded-2xl bg-canvas-sand p-3">
                      <div className="flex justify-between gap-3">
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
                    </div>
                  ))}
                  {owned && (
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        type="text"
                        placeholder="Add a note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="flex-1 px-3 py-2 border border-graphite-grey rounded-2xl text-sm bg-surface-white"
                      />
                      <button onClick={() => handleAddNote(activity.id)} className="btn-primary text-sm px-4 py-2">
                        Add note
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {activities.length === 0 && !showForm ? (
        <EmptyState
          icon="🗓️"
          title="No activities yet"
          description="Add your first family activity to start building your weekly schedule and keep everyone in sync."
          action={{ label: 'Create activity', onClick: () => setShowForm(true) }}
        />
      ) : null}

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
