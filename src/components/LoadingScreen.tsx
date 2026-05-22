export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-canvas-sand">
      <div className="text-center">
        <div className="mb-4 text-5xl animate-bounce">📅</div>
        <h1 className="text-2xl font-semibold text-charcoal-black mb-2">Family Scheduler</h1>
        <div className="flex items-center justify-center gap-2">
          <div className="spinner"></div>
          <p className="text-graphite-grey">Loading...</p>
        </div>
      </div>
    </div>
  )
}
