export const KEYBOARD_SHORTCUTS = {
  ADD_ACTIVITY: 'cmd+k',
  TOGGLE_THEME: 'cmd+shift+d',
  SEARCH: 'cmd+f',
  EXPORT: 'cmd+e',
  ARCHIVE: 'cmd+a'
}

export function setupKeyboardShortcuts(callbacks: {
  onAddActivity?: () => void
  onToggleTheme?: () => void
  onSearch?: () => void
  onExport?: () => void
  onArchive?: () => void
}) {
  const handleKeyDown = (e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const modifier = isMac ? e.metaKey : e.ctrlKey

    if (modifier && e.key === 'k') {
      e.preventDefault()
      callbacks.onAddActivity?.()
    }
    if (modifier && e.shiftKey && e.key === 'D') {
      e.preventDefault()
      callbacks.onToggleTheme?.()
    }
    if (modifier && e.key === 'f') {
      e.preventDefault()
      callbacks.onSearch?.()
    }
    if (modifier && e.key === 'e') {
      e.preventDefault()
      callbacks.onExport?.()
    }
    if (modifier && e.key === 'a') {
      e.preventDefault()
      callbacks.onArchive?.()
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}
