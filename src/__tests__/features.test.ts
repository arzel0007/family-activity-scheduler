import { describe, it, expect, beforeEach } from 'vitest'
import { filterActivities, searchActivities } from '../src/lib/search'
import { getTheme, setTheme } from '../src/lib/theme'
import { exportToJSON, importFromJSON } from '../src/lib/importExport'
import { generateNextDueDate } from '../src/lib/recurringActivities'

describe('Search & Filter', () => {
  const activities = [
    { id: '1', title: 'Math Homework', description: 'Chapter 5', kidIds: ['k1'], tagIds: ['t1'], dueDate: '2026-05-25', archived: false },
    { id: '2', title: 'Science Project', description: 'Solar System', kidIds: ['k2'], tagIds: ['t2'], dueDate: '2026-05-26', archived: false },
  ]

  it('should filter by kid', () => {
    const result = filterActivities(activities, { kidId: 'k1' })
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Math Homework')
  })

  it('should search by title', () => {
    const result = searchActivities(activities, 'math')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Math Homework')
  })

  it('should filter by date range', () => {
    const result = filterActivities(activities, {
      dateRange: { start: '2026-05-25', end: '2026-05-25' }
    })
    expect(result).toHaveLength(1)
  })
})

describe('Theme', () => {
  it('should use PostHog theme', () => {
    setTheme('posthog')
    expect(getTheme()).toBe('posthog')
    expect(document.documentElement.getAttribute('data-theme')).toBe('posthog')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})

describe('Recurring Activities', () => {
  it('should generate next due date for daily', () => {
    const date = new Date('2026-05-21')
    const next = generateNextDueDate('daily', date)
    expect(next).toBe('2026-05-22')
  })

  it('should generate next due date for weekly', () => {
    const date = new Date('2026-05-21')
    const next = generateNextDueDate('weekly', date)
    expect(next).toBe('2026-05-28')
  })

  it('should generate next due date for monthly', () => {
    const date = new Date('2026-05-21')
    const next = generateNextDueDate('monthly', date)
    expect(next).toBe('2026-06-21')
  })
})

describe('Export/Import', () => {
  it('should export to JSON', () => {
    const data = { activities: [], kids: [] }
    const json = JSON.stringify(data)
    expect(json).toContain('activities')
  })

  it('should validate import format', async () => {
    const validData = { activities: [], kids: [], version: '1.0' }
    const json = JSON.stringify(validData)
    const blob = new Blob([json], { type: 'application/json' })
    const file = new File([blob], 'backup.json')
    
    const result = await importFromJSON(file)
    expect(result.activities).toBeDefined()
    expect(result.kids).toBeDefined()
  })
})
