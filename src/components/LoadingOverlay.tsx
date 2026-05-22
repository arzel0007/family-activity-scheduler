interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
}

export function LoadingOverlay({ isLoading, message = 'Loading...' }: LoadingOverlayProps) {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-charcoal-black/30 backdrop-blur-sm flex items-center justify-center z-40">
      <div className="bg-surface-white p-6 rounded-lg shadow-xl flex flex-col items-center gap-3">
        <div className="spinner"></div>
        <p className="text-charcoal-black font-medium">{message}</p>
      </div>
    </div>
  )
}
