interface SkeletonLoaderProps {
  count?: number
  height?: string
  className?: string
}

export function SkeletonLoader({ count = 3, height = '120px', className = '' }: SkeletonLoaderProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton rounded border border-pale-granite bg-pale-granite"
          style={{ height }}
        />
      ))}
    </div>
  )
}
