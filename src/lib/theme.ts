/** PostHog Workshop — light theme only (see postHog/DESIGN.md in personalDailyTracker) */
export type Theme = 'posthog'

const STORAGE_KEY = 'theme'

export function getTheme(): Theme {
  return 'posthog'
}

export function setTheme(_theme: Theme) {
  localStorage.setItem(STORAGE_KEY, 'posthog')
  applyPostHogTheme()
}

export function initTheme() {
  localStorage.setItem(STORAGE_KEY, 'posthog')
  applyPostHogTheme()
}

function applyPostHogTheme() {
  const root = document.documentElement
  root.setAttribute('data-theme', 'posthog')
  root.classList.remove('dark')
}
