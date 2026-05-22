import { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
  direction?: 'up' | 'down' | 'left' | 'right'
  className?: string
}

export function PageTransition({
  children,
  direction = 'up',
  className = ''
}: PageTransitionProps) {
  const directionClass = {
    up: 'animate-in slide-in-from-bottom-4',
    down: 'animate-in slide-in-from-top-4',
    left: 'animate-in slide-in-from-right-4',
    right: 'animate-in slide-in-from-left-4'
  }[direction]

  return (
    <div className={`fade-in duration-300 ${directionClass} ${className}`}>
      {children}
    </div>
  )
}
