interface AvatarProps {
  name: string
  photoURL?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-lg',
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '?'
}

export function Avatar({ name, photoURL, size = 'md', className = '' }: AvatarProps) {
  const sizeClass = sizeClasses[size]

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name}
        className={`${sizeClass} rounded-full object-cover border border-pale-granite shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-sky-blue text-surface-white font-semibold flex items-center justify-center shrink-0 ${className}`}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  )
}
