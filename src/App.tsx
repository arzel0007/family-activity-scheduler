import { useState } from 'react'
import { useAuth } from './lib/auth'
import { KidsList } from './components/KidsList'
import { ActivitiesList } from './components/ActivitiesList'
import { LoginPage } from './components/LoginPage'

function App() {
  const { user, loading, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<'kids' | 'activities'>('kids')

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>

  if (!user) return <LoginPage />

  return (
    <div className="min-h-screen bg-surface-white">
      <header className="bg-surface-white border-b border-pale-granite">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-charcoal-black">Family Activity Scheduler</h1>
            {user && <p className="text-sm text-graphite-grey">Logged in as {user.email}</p>}
          </div>
          {user && (
            <button
              onClick={signOut}
              className="btn-secondary"
            >
              Sign Out
            </button>
          )}
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div>
          <div className="flex gap-8 mb-8 border-b border-pale-granite">
            <button
              onClick={() => setActiveTab('kids')}
              className={`px-3 py-2 font-medium transition-colors ${
                activeTab === 'kids'
                  ? 'border-b-2 border-sky-blue text-sky-blue'
                  : 'text-graphite-grey hover:text-charcoal-black'
              }`}
            >
              Kids
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-3 py-2 font-medium transition-colors ${
                activeTab === 'activities'
                  ? 'border-b-2 border-sky-blue text-sky-blue'
                  : 'text-graphite-grey hover:text-charcoal-black'
              }`}
            >
              Activities
            </button>
          </div>
          {activeTab === 'kids' && <KidsList />}
          {activeTab === 'activities' && <ActivitiesList />}
        </div>
      </main>
    </div>
  )
}

export default App
