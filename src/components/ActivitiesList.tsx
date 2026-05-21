import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
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
  due_date: string
  due_time: string
  activity_kids: { kid_id: string }[]
  notes: Note[]
  activity_tags: { tag_id: string }[]
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
    due_date: '',
    due_time: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [activitiesRes, kidsRes, tagsRes] = await Promise.all([
        supabase.from('activities').select('*, activity_kids(kid_id), notes(id, content), activity_tags(tag_id)').order('due_date'),
        supabase.from('kids').select('id, name').order('name'),
        supabase.from('tags').select('*').order('name'),
      ])

      if (activitiesRes.error) throw activitiesRes.error
      if (kidsRes.error) throw kidsRes.error
      if (tagsRes.error) throw tagsRes.error

      setActivities(activitiesRes.data || [])
      setKids(kidsRes.data || [])
      setTags(tagsRes.data || [])
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.title.trim() || selectedKids.length === 0) return

    try {
      if (editingId) {
        const { error } = await supabase
          .from('activities')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error

        await supabase.from('activity_kids').delete().eq('activity_id', editingId)
        await supabase.from('activity_kids').insert(
          selectedKids.map((kid_id) => ({ activity_id: editingId, kid_id }))
        )

        await supabase.from('activity_tags').delete().eq('activity_id', editingId)
        if (selectedTags.length > 0) {
          await supabase.from('activity_tags').insert(
            selectedTags.map((tag_id) => ({ activity_id: editingId, tag_id }))
          )
        }
      } else {
        const { data, error } = await supabase
          .from('activities')
          .insert([formData])
          .select()

        if (error) throw error
        if (data?.[0]) {
          await supabase.from('activity_kids').insert(
            selectedKids.map((kid_id) => ({ activity_id: data[0].id, kid_id }))
          )
          if (selectedTags.length > 0) {
            await supabase.from('activity_tags').insert(
              selectedTags.map((tag_id) => ({ activity_id: data[0].id, tag_id }))
            )
          }
        }
      }

      resetForm()
      fetchData()
    } catch (err) {
      console.error('Error saving activity:', err)
    }
  }

  async function handleAddNote(activityId: string) {
    if (!newNote.trim()) return
    try {
      const { error } = await supabase.from('notes').insert([{ activity_id: activityId, content: newNote }])
      if (error) throw error
      setNewNote('')
      fetchData()
    } catch (err) {
      console.error('Error adding note:', err)
    }
  }

  async function handleDeleteNote(noteId: string) {
    try {
      const { error } = await supabase.from('notes').delete().eq('id', noteId)
      if (error) throw error
      fetchData()
    } catch (err) {
      console.error('Error deleting note:', err)
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from('activities').delete().eq('id', id)
      if (error) throw error
      fetchData()
    } catch (err) {
      console.error('Error deleting activity:', err)
    }
  }

  function handleEdit(activity: Activity) {
    setEditingId(activity.id)
    setFormData({
      title: activity.title,
      description: activity.description || '',
      due_date: activity.due_date || '',
      due_time: activity.due_time || '',
    })
    setSelectedKids(activity.activity_kids.map((ak) => ak.kid_id))
    setSelectedTags(activity.activity_tags.map((at) => at.tag_id))
    setShowForm(true)
  }

  function handleExport() {
    const ics = generateICS(activities, kids)
    downloadICS(ics, `activities-${new Date().toISOString().split('T')[0]}.ics`)
  }

  function resetForm() {
    setFormData({ title: '', description: '', due_date: '', due_time: '' })
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
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="px-3 py-2 border rounded"
            />
            <input
              type="time"
              value={formData.due_time}
              onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
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
                  <span
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: tag.color }}
                  />
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
              {activity.due_date && <span>{activity.due_date}</span>}
              {activity.due_time && <span> at {activity.due_time}</span>}
            </div>
            <div className="mt-2 text-sm mb-2">
              <span className="font-medium">Kids: </span>
              {activity.activity_kids.length > 0
                ? activity.activity_kids
                    .map((ak) => kids.find((k) => k.id === ak.kid_id)?.name)
                    .filter(Boolean)
                    .join(', ')
                : 'No kids assigned'}
            </div>
            {activity.activity_tags.length > 0 && (
              <div className="flex gap-2 mb-2">
                {activity.activity_tags.map((at) => {
                  const tag = tags.find((t) => t.id === at.tag_id)
                  return tag ? (
                    <span
                      key={tag.id}
                      className="px-2 py-1 rounded text-xs text-white"
                      style={{ backgroundColor: tag.color }}
                    >
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
                      onClick={() => handleDeleteNote(note.id)}
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
