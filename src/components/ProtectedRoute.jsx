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

  // If loading with timeout, show retry message but DON'T block access
  // Allow user to continue if they have valid session/profile
  if (loading && timeoutReached) {
    // If user has valid session and profile, allow access even during refresh
    if (user && profile) {
      // Show warning but render children - don't block access
      return (
        <>
          {authError && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mx-4 mt-4 mb-4">
              <p className="text-yellow-400 text-sm text-center">
                {authError || 'Still loading... retrying'}
              </p>
            </div>
          )}
          {children}
        </>
      )
    }
    // Only show loading screen if we truly don't have user/profile
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-cascade-purple/30" />
            <p className="text-gray-500 text-sm">Still loading... retrying</p>
            {authError && (
              <p className="text-yellow-400 text-sm mt-2">{authError}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // If we have user and profile, check role and allow access
  // Even during loading (token refresh scenario) - don't block access
  if (user && profile) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    const hasRole = roles.includes(profile?.role)

    if (hasRole) {
      // User has correct role - allow access even during loading
      // Show warning banner if loading/refreshing
      return (
        <>
          {loading && authError && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mx-4 mt-4 mb-4">
              <p className="text-yellow-400 text-sm text-center">
                {authError || 'Still loading... retrying'}
              </p>
            </div>
          )}
          {children}
        </>
      )
    }

    // User doesn't have required role - but only redirect if not loading
    // During loading, it might be a token refresh
    if (!loading) {
      return <Navigate to="/" />
    }
    // During loading, show retry message
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-500">Verifying access... retrying</p>
          {authError && (
            <p className="text-yellow-400 text-sm mt-2">{authError}</p>
          )}
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

  // Not loading and no user - redirect to login
  if (!user) {
    return <Navigate to="/login" />
  }

  // Not loading, have user but no profile - show retry
  if (user && !profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-500">Loading profile... retrying</p>
          {authError && (
            <p className="text-yellow-400 text-sm mt-2">{authError}</p>
          )}
        </div>
      </div>
    )
  }

  // Fallback - shouldn't reach here
  return children
}
