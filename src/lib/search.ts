export interface SearchFilters {
  kidId?: string
  tagId?: string
  dateRange?: { start: string; end: string }
  searchTerm?: string
  archived?: boolean
}

export function filterActivities(
  activities: any[],
  filters: SearchFilters
): any[] {
  return activities.filter(activity => {
    if (filters.kidId && !activity.kidIds?.includes(filters.kidId)) return false
    if (filters.tagId && !activity.tagIds?.includes(filters.tagId)) return false
    if (filters.archived !== undefined && activity.archived !== filters.archived) return false
    
    if (filters.dateRange) {
      const dueDate = activity.dueDate
      if (dueDate < filters.dateRange.start || dueDate > filters.dateRange.end) return false
    }
    
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      const matchesTitle = activity.title?.toLowerCase().includes(term)
      const matchesDescription = activity.description?.toLowerCase().includes(term)
      if (!matchesTitle && !matchesDescription) return false
    }
    
    return true
  })
}

export function searchActivities(activities: any[], query: string): any[] {
  const term = query.toLowerCase()
  return activities.filter(activity =>
    activity.title?.toLowerCase().includes(term) ||
    activity.description?.toLowerCase().includes(term)
  )
}
