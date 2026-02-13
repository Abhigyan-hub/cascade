import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

async function ensureProfile(sessionUser) {
  if (!sessionUser?.id) return null

  const userId = sessionUser.id
  const email = sessionUser.email || ''
  const fullName =
    sessionUser.user_metadata?.full_name ||
    sessionUser.user_metadata?.name ||
    'User'

  // Try read - don't timeout aggressively, allow slow networks
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (data) return data
    if (error && error.code !== 'PGRST116') {
      console.error('Profile read error:', error)
      // Don't throw, continue to create
    }
  } catch (e) {
    console.error('Profile read failed:', e)
    // Continue to try creating profile
  }

  // If missing profile row (common when trigger didn't run), create it client-side.
  // RLS allows insert where auth.uid() = id.
  // Don't timeout aggressively - allow slow networks
  try {
    const { data: created, error: insertError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          role: 'client',
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single()

    if (insertError) {
      console.error('Profile upsert failed:', insertError)
      return null
    }

    return created
  } catch (e) {
    console.error('Profile upsert exception:', e)
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    let alive = true
    let timeoutId = null

    async function boot() {
      let sessionData = null
      try {
        const { data } = await supabase.auth.getSession()
        sessionData = data
        if (!alive) return
        setSession(data.session || null)
        if (data.session?.user) {
          const prof = await ensureProfile(data.session.user)
          if (!alive) return
          setProfile(prof)
          setAuthError(null)
        } else {
          setProfile(null)
          setAuthError(null)
        }
      } catch (e) {
        console.warn('Auth boot error (non-fatal):', e)
        const errorMsg = e.message || 'Auth initialization error'
        // If timeout, show retry message
        if (errorMsg.includes('timeout')) {
          setAuthError('Still loading... retrying')
        } else {
          setAuthError(errorMsg + ' - retrying...')
        }
        // DON'T clear profile if we have one - keep existing state
        // Only clear if we truly have no session
        if (!sessionData?.session) {
          setProfile(null)
        }
      } finally {
        if (alive) {
          setLoading(false)
          if (timeoutId) clearTimeout(timeoutId)
        }
      }
    }

    // Set a maximum timeout for initial auth load - but don't treat as failure
    // Just show warning and allow it to continue
    timeoutId = setTimeout(() => {
      if (alive && loading) {
        console.warn('Auth boot taking longer than expected - still retrying...')
        // Don't force loading to false - allow it to complete
        // Just show a warning message
        setAuthError('Still loading... retrying')
      }
    }, 10000) // 10 second warning, but don't give up

    boot()

    let authStateChangeTimeout = null
    
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!alive) return
      
      // Clear any existing timeout
      if (authStateChangeTimeout) {
        clearTimeout(authStateChangeTimeout)
        authStateChangeTimeout = null
      }
      
      setSession(newSession || null)
      setLoading(true)
      setAuthError(null)
      
      let profileFetched = false
      
      // Set a timeout for auth state changes - show warning but DON'T clear session/profile
      // This allows token refresh to complete without losing access
      authStateChangeTimeout = setTimeout(() => {
        if (alive && !profileFetched) {
          console.warn('Auth state change taking longer than expected - still retrying...')
          // DON'T clear session/profile - just show warning and keep loading
          // This allows Supabase token refresh to complete
          setAuthError('Still loading... retrying')
          // Keep loading=true to allow retry
        }
      }, 5000) // 5 second warning, but don't give up
      
      try {
        if (newSession?.user) {
          // Try to fetch profile - but don't timeout aggressively
          // Allow it to complete even if slow (token refresh can be slow)
          try {
            const prof = await ensureProfile(newSession.user)
            profileFetched = true
            if (!alive) return
            if (authStateChangeTimeout) {
              clearTimeout(authStateChangeTimeout)
              authStateChangeTimeout = null
            }
            setProfile(prof)
            setAuthError(null)
          } catch (e) {
            // If profile fetch fails, log but don't clear session
            // Keep existing profile if available
            console.warn('Profile fetch error during refresh:', e)
            profileFetched = true
            if (!alive) return
            if (authStateChangeTimeout) {
              clearTimeout(authStateChangeTimeout)
              authStateChangeTimeout = null
            }
            // Don't clear profile - keep existing one if available
            // Set error but don't clear profile - let it retry
            setAuthError('Profile fetch failed - retrying...')
            // Profile state will remain unchanged (keep existing if any)
          }
        } else {
          profileFetched = true
          setProfile(null)
          setAuthError(null)
        }
      } catch (e) {
        profileFetched = true
        console.warn('Auth state change error (non-fatal):', e)
        // Don't treat errors as fatal - keep existing session/profile
        // Only set error message, don't clear state
        const errorMsg = e.message || 'Auth state change error'
        // If it's a timeout, show retry message
        if (errorMsg.includes('timeout')) {
          setAuthError('Still loading... retrying')
        } else {
          setAuthError(errorMsg + ' - retrying...')
        }
        // DON'T clear profile - keep existing one if available
        // Only clear if it's a signout event
        if (!newSession) {
          setSession(null)
          setProfile(null)
        }
        // Otherwise, keep existing profile
      } finally {
        if (authStateChangeTimeout) {
          clearTimeout(authStateChangeTimeout)
          authStateChangeTimeout = null
        }
        if (alive) {
          setLoading(false)
        }
      }
    })

    return () => {
      alive = false
      if (timeoutId) clearTimeout(timeoutId)
      if (authStateChangeTimeout) clearTimeout(authStateChangeTimeout)
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => {
    return {
      session,
      user: session?.user || null,
      profile,
      loading,
      authError,
      async signOut() {
        // CRITICAL: Always allow sign out, even if network fails
        // Clear state FIRST, then try to sign out (non-blocking)
        setSession(null)
        setProfile(null)
        setLoading(false)
        setAuthError(null)
        
        // Try to sign out, but don't wait for it - use timeout
        const signOutPromise = supabase.auth.signOut()
        const timeoutPromise = new Promise((resolve) => 
          setTimeout(() => {
            console.warn('SignOut timeout - forcing local signout')
            resolve({ error: { message: 'Timeout' } })
          }, 2000)
        )
        
        try {
          const result = await Promise.race([signOutPromise, timeoutPromise])
          if (result?.error) {
            console.warn('Remote signOut failed, trying local:', result.error)
            // Try local signout with timeout
            const localSignOutPromise = supabase.auth.signOut({ scope: 'local' })
            const localTimeout = new Promise((resolve) => 
              setTimeout(() => resolve({ error: { message: 'Local timeout' } }), 1000)
            )
            await Promise.race([localSignOutPromise, localTimeout])
          }
        } catch (e) {
          console.error('SignOut error (non-blocking):', e)
          // State already cleared, just try local as last resort
          try {
            const localPromise = supabase.auth.signOut({ scope: 'local' })
            const localTimeout = new Promise((resolve) => setTimeout(() => resolve(), 500))
            await Promise.race([localPromise, localTimeout])
          } catch (localErr) {
            console.error('Local signOut also failed (ignoring):', localErr)
          }
        }
        
        // Force navigation to login (non-blocking)
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.href = '/login'
          }, 100)
        }
      },
      async refreshProfile() {
        if (!session?.user) return
        try {
          setLoading(true)
          const prof = await ensureProfile(session.user)
          setProfile(prof)
          setAuthError(null)
        } catch (e) {
          console.error('Refresh profile failed:', e)
          setAuthError(e.message || 'Profile refresh failed')
        } finally {
          setLoading(false)
        }
      },
    }
  }, [session, profile, loading, authError])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

