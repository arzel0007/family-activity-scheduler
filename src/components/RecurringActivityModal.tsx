import { useState } from 'react'
import { Modal } from './Modal'
import { createRecurringActivity } from '../lib/recurringActivities'
import { useToast } from '../lib/toast'

interface RecurringActivityModalProps {
  isOpen: boolean
  onClose: () => void
  kids: any[]
  onSuccess: () => void
}

export function RecurringActivityModal({
  isOpen,
  onClose,
  kids,
  onSuccess
}: RecurringActivityModalProps) {
  const { addToast } = useToast()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueTime: '09:00',
    recurrence: 'weekly' as const,
    recurrenceEnd: ''
  })
  const [selectedKids, setSelectedKids] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || selectedKids.length === 0) {
      addToast({ title: 'Error', message: 'Title and kids required', type: 'error' })
      return
    }

    await createRecurringActivity({
      title: formData.title,
      description: formData.description,
      dueTime: formData.dueTime,
      kidIds: selectedKids,
      tagIds: selectedTags,
      recurrence: formData.recurrence,
      recurrenceEnd: formData.recurrenceEnd || undefined,
      active: true
    })

    addToast({ title: 'Success', message: 'Recurring activity created', type: 'success' })
    setFormData({ title: '', description: '', dueTime: '09:00', recurrence: 'weekly', recurrenceEnd: '' })
    setSelectedKids([])
    setSelectedTags([])
    onSuccess()
    onClose()
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Recurring Activity">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Activity title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border border-pale-granite rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-blue"
        />

        <textarea
          placeholder="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 border border-pale-granite rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-blue"
          rows={3}
        />

        <input
          type="time"
          value={formData.dueTime}
          onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
          className="w-full px-4 py-2 border border-pale-granite rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-blue"
        />

        <select
          value={formData.recurrence}
          onChange={(e) => setFormData({ ...formData, recurrence: e.target.value as any })}
          className="w-full px-4 py-2 border border-pale-granite rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-blue"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>

        <input
          type="date"
          placeholder="End date (optional)"
          value={formData.recurrenceEnd}
          onChange={(e) => setFormData({ ...formData, recurrenceEnd: e.target.value })}
          className="w-full px-4 py-2 border border-pale-granite rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-blue"
        />

        <div>
          <label className="block text-sm font-medium mb-2">Select Kids</label>
          <div className="space-y-2">
            {kids.map(kid => (
              <label key={kid.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedKids.includes(kid.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedKids([...selectedKids, kid.id])
                    } else {
                      setSelectedKids(selectedKids.filter(id => id !== kid.id))
                    }
                  }}
                  className="w-4 h-4"
                />
                {kid.name}
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" className="btn-primary flex-1">
            Create
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}
