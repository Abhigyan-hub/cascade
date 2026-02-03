import { Navigate } from '@tanstack/react-router'
import { useAuth } from '../lib/authContext'

export default function ProtectedRoute({ requiredRole, children }) {
  const { user, profile, loading } = useAuth()

  // If user is logged in but profile (role) hasn't loaded yet, don't redirect.
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-cascade-purple/30" />
          <p className="text-gray-500 text-sm">Loading your account…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (!profile) {
    // Profile missing even after loading -> treat as client fallback
    return <Navigate to="/" />
  }

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  const hasRole = roles.includes(profile?.role)

  if (!hasRole) {
    return <Navigate to="/" />
  }

  return children
}
