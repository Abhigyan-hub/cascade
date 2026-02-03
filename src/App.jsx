import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Home from './pages/Home'
import EventDetail from './pages/EventDetail'
import Register from './pages/Register'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import AdminDashboard from './pages/dashboard/AdminDashboard'
import DeveloperDashboard from './pages/dashboard/DeveloperDashboard'
import CreateEvent from './pages/admin/CreateEvent'
import EditEvent from './pages/admin/EditEvent'
import EventRegistrations from './pages/admin/EventRegistrations'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLoading(false)
    }, 5000)

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          return fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
      })
      .catch((error) => {
        console.error('Auth session error:', error)
      })
      .finally(() => {
        clearTimeout(timeoutId)
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Profile fetch error:', error)
        return
      }
      setProfile(data)
    } catch (error) {
      console.error('Profile fetch failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cascade-darker">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-cascade-purple/30" />
          <p className="text-gray-500">Loading CASCADE...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Layout user={user} profile={profile} />}>
        <Route index element={<Home />} />
        <Route path="events/:eventId" element={<EventDetail user={user} profile={profile} />} />
        <Route
          path="events/:eventId/register"
          element={
            <ProtectedRoute user={user} profile={profile} requiredRole="client">
              <Register profile={profile} />
            </ProtectedRoute>
          }
        />
        <Route path="login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="signup" element={user ? <Navigate to="/" replace /> : <SignUp />} />

        {/* Admin Routes */}
        <Route
          path="admin"
          element={
            <ProtectedRoute user={user} profile={profile} requiredRole={['admin', 'developer']}>
              <AdminDashboard profile={profile} />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/events/new"
          element={
            <ProtectedRoute user={user} profile={profile} requiredRole={['admin', 'developer']}>
              <CreateEvent profile={profile} />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/events/:eventId/edit"
          element={
            <ProtectedRoute user={user} profile={profile} requiredRole={['admin', 'developer']}>
              <EditEvent profile={profile} />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/events/:eventId/registrations"
          element={
            <ProtectedRoute user={user} profile={profile} requiredRole={['admin', 'developer']}>
              <EventRegistrations profile={profile} />
            </ProtectedRoute>
          }
        />

        {/* Developer Dashboard */}
        <Route
          path="developer"
          element={
            <ProtectedRoute user={user} profile={profile} requiredRole="developer">
              <DeveloperDashboard profile={profile} />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
