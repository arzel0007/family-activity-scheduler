// Accessibility utilities for ARIA labels and keyboard navigation

export const ariaLabels = {
  closeButton: 'Close',
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  delete: 'Delete',
  edit: 'Edit',
  save: 'Save',
  cancel: 'Cancel',
  loading: 'Loading',
  error: 'Error',
  success: 'Success',
  expand: 'Expand',
  collapse: 'Collapse',
  moreOptions: 'More options',
  previous: 'Previous',
  next: 'Next',
  goToTop: 'Go to top',
  skipToContent: 'Skip to main content'
}

export type KeyboardKey = 'Enter' | 'Escape' | 'Space' | 'Tab' | 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'

export function isKey(event: React.KeyboardEvent, key: KeyboardKey): boolean {
  return event.key === key
}

export function handleKeyboardNavigation(
  event: React.KeyboardEvent,
  handlers: Partial<Record<KeyboardKey, () => void>>
) {
  const key = event.key as KeyboardKey
  const handler = handlers[key]
  
  if (handler) {
    event.preventDefault()
    handler()
  }
}

// Keyboard shortcut helpers
export function useKeyboardShortcut(
  key: KeyboardKey,
  callback: () => void,
  options?: { ctrlKey?: boolean; shiftKey?: boolean }
) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const keyMatch = event.key === key
      const ctrlMatch = options?.ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey
      const shiftMatch = options?.shiftKey ? event.shiftKey : !event.shiftKey

      if (keyMatch && ctrlMatch && shiftMatch) {
        event.preventDefault()
        callback()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [key, callback, options])
}

// Focus management
export function focusTrap(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const firstElement = focusableElements[0] as HTMLElement
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

  return {
    first: firstElement,
    last: lastElement,
    elements: Array.from(focusableElements) as HTMLElement[]
  }
}

// Screen reader announcements
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)
  
  // Remove after announcement
  setTimeout(() => announcement.remove(), 1000)
}

// Import React
import React from 'react'

// Semantic HTML helpers
export const semanticElements = {
  button: { role: 'button', tabIndex: 0 },
  link: { role: 'link', tabIndex: 0 },
  list: { role: 'list' },
  listItem: { role: 'listitem' }
}

// Color contrast checker (simple)
export function getContrastColor(hexColor: string): 'light' | 'dark' {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? 'dark' : 'light'
}
