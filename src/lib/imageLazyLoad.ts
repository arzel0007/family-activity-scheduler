// Utility for optimized lazy loading of images
interface LazyImageOptions {
  src: string
  alt: string
  placeholder?: string
  width?: number
  height?: number
  loading?: 'lazy' | 'eager'
}

export function getResponsiveImageSrcSet(src: string, widths: number[] = [320, 640, 1024]): string {
  // Generate responsive image sources (simplified)
  return widths
    .map(width => `${src}?w=${width} ${width}w`)
    .join(', ')
}

export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`))
    img.src = src
  })
}

export function setupIntersectionObserver(imageElements: HTMLImageElement[]) {
  if (!('IntersectionObserver' in window)) {
    // Fallback for browsers that don't support IntersectionObserver
    imageElements.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src
      }
    })
    return
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        if (img.dataset.src) {
          img.src = img.dataset.src
          if (img.dataset.srcset) {
            img.srcSet = img.dataset.srcset
          }
          img.classList.add('loaded')
          observer.unobserve(img)
        }
      }
    })
  }, {
    rootMargin: '50px'
  })

  imageElements.forEach(img => imageObserver.observe(img))
  return imageObserver
}

export const createLazyImageAttrs = (options: LazyImageOptions) => ({
  alt: options.alt,
  loading: options.loading || 'lazy' as const,
  width: options.width,
  height: options.height,
  src: options.placeholder || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E',
  'data-src': options.src,
  className: 'lazyload'
})
