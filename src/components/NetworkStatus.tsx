import { useNetworkStatus } from '../lib/useNetworkStatus'

export function NetworkStatus() {
  const { status } = useNetworkStatus()

  if (status === 'online') return null

  const config = {
    offline: {
      bg: 'bg-vivid-green',
      icon: '📡',
      message: 'You\'re offline. Changes will sync when you\'re back online.'
    },
    slow: {
      bg: 'bg-sunset-orange',
      icon: '🐌',
      message: 'Slow connection detected. Some features may be limited.'
    }
  }

  const { bg, icon, message } = config[status] || config.offline

  return (
    <div 
      className={`${bg} text-charcoal-black px-4 py-2 text-sm font-medium flex items-center gap-2 justify-center`}
      role="status"
      aria-live="polite"
    >
      <span>{icon}</span>
      <span>{message}</span>
    </div>
  )
}
