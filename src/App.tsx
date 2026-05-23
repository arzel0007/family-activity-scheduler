import { useState, useEffect } from 'react'
import { useAuth } from './lib/auth'
import { KidsList } from './components/KidsList'
import { ActivitiesList } from './components/ActivitiesList'
import { LoginPage } from './components/LoginPage'
import { Header } from './components/Header'
import { SearchFilterModal } from './components/SearchFilterModal'
import { RecurringActivityModal } from './components/RecurringActivityModal'
import { AdminPanel } from './components/AdminPanel'
import { LoadingScreen } from './components/LoadingScreen'
import { initTheme } from './lib/theme'
import { initFCM, listenForMessages } from './lib/fcm'
import { subscribeParentToNotifications } from './lib/notificationService'
import { initIndexedDB } from './lib/offlineCache'
import { generateICS, downloadICS } from './lib/ics'
import { importActivitiesAndKids } from './lib/importExport'
import { useToast } from './lib/toast'

function App() {
  const { user, loading, isSuperAdmin } = useAuth()
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState<'kids' | 'activities' | 'admin'>('kids')
  const [showSearch, setShowSearch] = useState(false)
  const [showRecurring, setShowRecurring] = useState(false)
  const [activities, setActivities] = useState<any[]>([])
  const [kids, setKids] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])

  useEffect(() => {
    initTheme()
    initIndexedDB()
  }, [])

  useEffect(() => {
    if (!user) return

    // Initialize FCM
    initFCM().then((token) => {
      if (token) {
        subscribeParentToNotifications(token)
        listenForMessages((payload) => {
          addToast({
            title: payload.notification?.title || 'New Update',
            message: payload.notification?.body || '',
            type: 'info'
          })
        })
      }
    })

    // Register service worker (must respect Vite base path)
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`
      navigator.serviceWorker.register(swUrl).catch(() => {
        // Offline/PWA is optional in local dev
      })
    }
  }, [user, addToast])

  const handleExport = async () => {
    if (activities.length === 0) {
      addToast({ message: 'No activities to add to calendar', type: 'info' })
      return
    }
    try {
      const ics = generateICS(activities, kids)
      downloadICS(ics, `family-activities-${new Date().toISOString().slice(0, 10)}.ics`)
      addToast({ message: `${activities.length} activities added to calendar`, type: 'success' })
    } catch (error) {
      addToast({ message: 'Failed to add to calendar', type: 'error' })
    }
  }

  const handleImport = async (file: File) => {
    try {
      await importActivitiesAndKids(file)
      addToast({ message: 'Data imported', type: 'success' })
    } catch (error) {
      addToast({ message: 'Import failed', type: 'error' })
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) return <LoginPage />

  return (
    <div className="min-h-screen bg-canvas-sand">
      <Header
        onAddActivity={() => setShowRecurring(true)}
        onExport={handleExport}
        onImport={handleImport}
        onSearch={() => setShowSearch(true)}
      />

      <main className="max-w-[958px] mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="ph-tabs flex-1">
            <button
              onClick={() => setActiveTab('kids')}
              className={`ph-tab ${activeTab === 'kids' ? 'ph-tab-active' : ''}`}
            >
              Kids
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`ph-tab ${activeTab === 'activities' ? 'ph-tab-active' : ''}`}
            >
              Activities
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`ph-tab ${activeTab === 'admin' ? 'ph-tab-active' : ''}`}
              >
                Admin
              </button>
            )}
          </div>
        </div>

        {activeTab === 'kids' && <KidsList />}
        {activeTab === 'activities' && (
          <ActivitiesList
            onActivitiesChange={setActivities}
            onKidsChange={setKids}
            onTagsChange={setTags}
          />
        )}
        {activeTab === 'admin' && isSuperAdmin && <AdminPanel />}
      </main>

      <SearchFilterModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        activities={activities}
        kids={kids}
        tags={tags}
        onFilter={() => {}}
      />

      <RecurringActivityModal
        isOpen={showRecurring}
        onClose={() => setShowRecurring(false)}
        kids={kids}
        onSuccess={() => {}}
      />
    </div>
  )
}

export default App
