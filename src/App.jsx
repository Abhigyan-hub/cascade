import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Home from './pages/Home'
import EventDetail from './pages/EventDetail'
import Register from './pages/Register'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import ClientDashboard from './pages/dashboard/ClientDashboard'
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
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

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
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
            <ProtectedRoute user={user} requiredRole="client">
              <Register profile={profile} />
            </ProtectedRoute>
          }
        />
        <Route path="login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="signup" element={user ? <Navigate to="/" replace /> : <SignUp />} />

        {/* Client Dashboard */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute user={user} requiredRole="client">
              <ClientDashboard profile={profile} />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="admin"
          element={
            <ProtectedRoute user={user} requiredRole={['admin', 'developer']}>
              <AdminDashboard profile={profile} />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/events/new"
          element={
            <ProtectedRoute user={user} requiredRole={['admin', 'developer']}>
              <CreateEvent profile={profile} />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/events/:eventId/edit"
          element={
            <ProtectedRoute user={user} requiredRole={['admin', 'developer']}>
              <EditEvent profile={profile} />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/events/:eventId/registrations"
          element={
            <ProtectedRoute user={user} requiredRole={['admin', 'developer']}>
              <EventRegistrations profile={profile} />
            </ProtectedRoute>
          }
        />

        {/* Developer Dashboard */}
        <Route
          path="developer"
          element={
            <ProtectedRoute user={user} requiredRole="developer">
              <DeveloperDashboard profile={profile} />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
