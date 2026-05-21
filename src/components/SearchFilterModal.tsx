import { useState } from 'react'
import { Modal } from './Modal'
import { filterActivities, SearchFilters } from '../lib/search'

interface SearchFilterModalProps {
  isOpen: boolean
  onClose: () => void
  activities: any[]
  kids: any[]
  tags: any[]
  onFilter: (filtered: any[]) => void
}

export function SearchFilterModal({
  isOpen,
  onClose,
  activities,
  kids,
  tags,
  onFilter
}: SearchFilterModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedKid, setSelectedKid] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')

  const handleFilter = () => {
    const filters: SearchFilters = {
      searchTerm: searchTerm || undefined,
      kidId: selectedKid || undefined,
      tagId: selectedTag || undefined,
      dateRange: dateStart && dateEnd ? { start: dateStart, end: dateEnd } : undefined,
      archived: false
    }

    const filtered = filterActivities(activities, filters)
    onFilter(filtered)
    onClose()
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search & Filter">
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search activities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-pale-granite rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-blue"
        />

        <select
          value={selectedKid}
          onChange={(e) => setSelectedKid(e.target.value)}
          className="w-full px-4 py-2 border border-pale-granite rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-blue"
        >
          <option value="">All Kids</option>
          {kids.map(kid => (
            <option key={kid.id} value={kid.id}>{kid.name}</option>
          ))}
        </select>

        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="w-full px-4 py-2 border border-pale-granite rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-blue"
        >
          <option value="">All Tags</option>
          {tags.map(tag => (
            <option key={tag.id} value={tag.id}>{tag.name}</option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="px-4 py-2 border border-pale-granite rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-blue"
          />
          <input
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="px-4 py-2 border border-pale-granite rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-blue"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button onClick={handleFilter} className="btn-primary flex-1">
            Apply Filters
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}
