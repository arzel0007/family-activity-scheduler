import { ReactNode } from 'react'

interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
}

export function ResponsiveContainer({ children, className = '' }: ResponsiveContainerProps) {
  return (
    <div className={`w-full max-w-[958px] mx-auto px-4 md:px-6 py-6 md:py-8 ${className}`}>
      {children}
    </div>
  )
}
