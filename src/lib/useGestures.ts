import { useRef, useCallback, useEffect } from 'react'

interface SwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
}

interface PinchOptions {
  onPinch?: (scale: number) => void
  threshold?: number
}

export function useSwipe(element: React.RefObject<HTMLElement>, options: SwipeOptions) {
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const { threshold = 50 } = options

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const diffX = touchStartX.current - touchEndX
    const diffY = touchStartY.current - touchEndY

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        options.onSwipeLeft?.()
      } else {
        options.onSwipeRight?.()
      }
    }

    if (Math.abs(diffY) > threshold) {
      if (diffY > 0) {
        options.onSwipeUp?.()
      } else {
        options.onSwipeDown?.()
      }
    }
  }, [options, threshold])

  useEffect(() => {
    const el = element.current
    if (!el) return

    el.addEventListener('touchstart', handleTouchStart)
    el.addEventListener('touchend', handleTouchEnd)

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [element, handleTouchStart, handleTouchEnd])
}

export function usePinch(element: React.RefObject<HTMLElement>, options: PinchOptions) {
  const touchStartDistance = useRef(0)
  const { threshold = 0.1 } = options

  const getDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      touchStartDistance.current = getDistance(e.touches)
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistance.current > 0) {
      const currentDistance = getDistance(e.touches)
      const scale = currentDistance / touchStartDistance.current
      
      if (Math.abs(scale - 1) > threshold) {
        options.onPinch?.(scale)
      }
    }
  }, [options, threshold])

  const handleTouchEnd = useCallback(() => {
    touchStartDistance.current = 0
  }, [])

  useEffect(() => {
    const el = element.current
    if (!el) return

    el.addEventListener('touchstart', handleTouchStart)
    el.addEventListener('touchmove', handleTouchMove)
    el.addEventListener('touchend', handleTouchEnd)

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [element, handleTouchStart, handleTouchMove, handleTouchEnd])
}

export function useLongPress(element: React.RefObject<HTMLElement>, callback: () => void, duration = 500) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTouchStart = useCallback(() => {
    timeoutRef.current = setTimeout(callback, duration)
  }, [callback, duration])

  const handleTouchEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    const el = element.current
    if (!el) return

    el.addEventListener('touchstart', handleTouchStart)
    el.addEventListener('touchend', handleTouchEnd)
    el.addEventListener('touchmove', handleTouchEnd)

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchend', handleTouchEnd)
      el.removeEventListener('touchmove', handleTouchEnd)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [element, handleTouchStart, handleTouchEnd])
}
