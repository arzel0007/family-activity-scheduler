// Animation utilities and transitions

export const transitions = {
  fast: 'transition-all duration-150 ease-in-out',
  normal: 'transition-all duration-300 ease-in-out',
  slow: 'transition-all duration-500 ease-in-out',
  smooth: 'transition-all duration-700 ease-in-out'
}

export const animations = {
  slideInRight: 'animate-in slide-in-from-left-1/2 fade-in duration-300',
  slideInLeft: 'animate-in slide-in-from-right-1/2 fade-in duration-300',
  slideInUp: 'animate-in slide-in-from-bottom-4 fade-in duration-300',
  fadeIn: 'animate-in fade-in duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-300'
}

export function createFadeTransition(duration = 300) {
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: duration / 1000 }
  }
}

export function createSlideTransition(direction: 'up' | 'down' | 'left' | 'right' = 'up', duration = 300) {
  const variants = {
    initial: {
      up: { opacity: 0, y: 20 },
      down: { opacity: 0, y: -20 },
      left: { opacity: 0, x: 20 },
      right: { opacity: 0, x: -20 }
    },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: {
      up: { opacity: 0, y: -20 },
      down: { opacity: 0, y: 20 },
      left: { opacity: 0, x: -20 },
      right: { opacity: 0, x: 20 }
    }
  }

  return {
    initial: variants.initial[direction],
    animate: variants.animate,
    exit: variants.exit[direction],
    transition: { duration: duration / 1000 }
  }
}

// Stagger animation for lists
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
}

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
}

// Page transition helper
export function usePageTransition() {
  return {
    enter: 'transition-all duration-300 ease-in-out',
    exit: 'transition-all duration-300 ease-out opacity-0'
  }
}
