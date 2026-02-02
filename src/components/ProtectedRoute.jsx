import { Navigate, useLocation } from 'react-router-dom'

export default function ProtectedRoute({ user, profile, requiredRole, children }) {
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  const hasRole = roles.includes(profile?.role)

  if (!hasRole) {
    return <Navigate to="/" replace />
  }

  return children
}
