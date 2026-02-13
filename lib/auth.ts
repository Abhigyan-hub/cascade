import { supabase } from './supabase/client'
import { UserRole } from './supabase/types'

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile ? { ...user, ...profile } : null
}

export async function requireAuth(requiredRole?: UserRole) {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  if (requiredRole) {
    if (requiredRole === 'developer' && user.role !== 'developer') {
      throw new Error('Forbidden: Developer access required')
    }
    if (requiredRole === 'admin' && !['admin', 'developer'].includes(user.role)) {
      throw new Error('Forbidden: Admin access required')
    }
  }

  return user
}
