import { useState } from 'react'
import { isConfigured } from './supabaseClient'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import Login from './pages/Login'
import SetupNeeded from './pages/SetupNeeded'
import Layout from './components/Layout'
import Calendar from './pages/Calendar'
import Renters from './pages/Renters'
import Revenue from './pages/Revenue'
import Settings from './pages/Settings'

function Shell() {
  const { user, loading } = useAuth()
  const [view, setView] = useState('calendar')

  if (loading) return <div className="center-screen"><div className="spinner" /></div>
  if (!user) return <Login />

  return (
    <DataProvider>
      <Layout view={view} setView={setView}>
        {view === 'calendar' && <Calendar />}
        {view === 'renters' && <Renters />}
        {view === 'revenue' && <Revenue />}
        {view === 'settings' && <Settings />}
      </Layout>
    </DataProvider>
  )
}

export default function App() {
  if (!isConfigured) return <SetupNeeded />
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}
