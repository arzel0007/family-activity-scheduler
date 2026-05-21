import { useState, useEffect } from 'react'
import { getTheme, toggleTheme } from '../lib/theme'
import { setupKeyboardShortcuts } from '../lib/keyboardShortcuts'

interface HeaderProps {
  onAddActivity: () => void
  onExport: () => void
  onSearch: () => void
}

export function Header({ onAddActivity, onExport, onSearch }: HeaderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(getTheme())

  useEffect(() => {
    const cleanup = setupKeyboardShortcuts({
      onAddActivity,
      onToggleTheme: () => {
        const newTheme = toggleTheme()
        setTheme(newTheme)
      },
      onSearch,
      onExport
    })

    return cleanup
  }, [onAddActivity, onExport, onSearch])

  return (
    <header className="bg-surface-white dark:bg-charcoal-black border-b border-pale-granite dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-charcoal-black dark:text-surface-white">
            Family Activity Scheduler
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onSearch}
            className="btn-secondary"
            title="Search (Cmd+F)"
          >
            🔍
          </button>
          <button
            onClick={onAddActivity}
            className="btn-primary"
            title="Add Activity (Cmd+K)"
          >
            + Activity
          </button>
          <button
            onClick={onExport}
            className="btn-secondary"
            title="Export (Cmd+E)"
          >
            ⬇️
          </button>
          <button
            onClick={() => {
              const newTheme = toggleTheme()
              setTheme(newTheme)
            }}
            className="btn-secondary"
            title="Toggle Theme (Cmd+Shift+D)"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </header>
  )
}
