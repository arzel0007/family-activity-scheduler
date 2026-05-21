import { useState } from 'react'
import { useAuth } from './lib/auth'
import { KidsList } from './components/KidsList'
import { ActivitiesList } from './components/ActivitiesList'

function App() {
  const { user, loading, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<'kids' | 'activities'>('kids')

  if (loading) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Family Activity Scheduler</h1>
            {user && <p className="text-sm text-gray-600">Logged in as {user.email}</p>}
          </div>
          {user && (
            <button
              onClick={signOut}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          )}
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {user ? (
          <div>
            <div className="flex gap-4 mb-6 border-b">
              <button
                onClick={() => setActiveTab('kids')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'kids'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Kids
              </button>
              <button
                onClick={() => setActiveTab('activities')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'activities'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Activities
              </button>
            </div>
            {activeTab === 'kids' && <KidsList />}
            {activeTab === 'activities' && <ActivitiesList />}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Please sign in to continue.</p>
            <p className="text-sm text-gray-500">Use Supabase authentication to get started.</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
