import { Navigate } from '@tanstack/react-router'
import { useAuth } from '../lib/authContext'
import { useState, useEffect } from 'react'

export default function ProtectedRoute({ requiredRole, children }) {
  const { user, profile, loading, authError, signOut } = useAuth()
  const [timeoutReached, setTimeoutReached] = useState(false)

  // Safety timeout: if loading takes more than 15 seconds, show escape option
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setTimeoutReached(true)
      }, 15000) // 15 second max
      return () => clearTimeout(timeout)
    } else {
      setTimeoutReached(false)
    }
  }, [loading])

  // If loading with timeout, show escape option
  if (loading && timeoutReached) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-cascade-purple/30" />
            <p className="text-gray-500 text-sm">Loading your account…</p>
            {authError && (
              <p className="text-red-400 text-sm mt-2">Error: {authError}</p>
            )}
          </div>
          <div className="mt-6 space-y-2">
            <p className="text-gray-500 text-sm">Taking longer than expected?</p>
            <button
              onClick={signOut}
              className="btn-secondary text-sm"
            >
              Sign Out & Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  // If still loading (but not timed out), show normal loader
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

  // If profile is missing after loading, allow fallback to home
  // Don't block the user - let them access public routes
  if (!profile) {
    console.warn('Profile missing after auth load - redirecting to home')
    return <Navigate to="/" />
  }

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  const hasRole = roles.includes(profile?.role)

  if (!hasRole) {
    return <Navigate to="/" />
  }

  return children
}
