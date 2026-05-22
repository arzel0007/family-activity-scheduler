import { useEffect, useRef } from 'react'
import { preloadImage } from '../lib/imageLazyLoad'

interface LazyImageProps {
  src: string
  alt: string
  placeholder?: string
  width?: number
  height?: number
  className?: string
  onLoad?: () => void
}

export function LazyImage({
  src,
  alt,
  placeholder,
  width,
  height,
  className = '',
  onLoad
}: LazyImageProps) {
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const img = imgRef.current
    if (!img) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            preloadImage(src)
              .then(() => {
                img.src = src
                img.classList.add('loaded')
                onLoad?.()
              })
              .catch(err => {
                console.error('Failed to load image:', err)
              })
            observer.unobserve(img)
          }
        })
      },
      { rootMargin: '50px' }
    )

    observer.observe(img)
    return () => observer.disconnect()
  }, [src, onLoad])

  return (
    <img
      ref={imgRef}
      src={placeholder || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E'}
      alt={alt}
      width={width}
      height={height}
      className={`lazyload transition-opacity duration-300 ${className}`}
      loading="lazy"
    />
  )
}
