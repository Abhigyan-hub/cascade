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

  // Try read with timeout
  try {
    const readPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Profile read timeout')), 3000)
    )
    
    const { data, error } = await Promise.race([readPromise, timeoutPromise])

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
  try {
    const upsertPromise = supabase
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
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Profile upsert timeout')), 3000)
    )
    
    const { data: created, error: insertError } = await Promise.race([upsertPromise, timeoutPromise])

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
      try {
        const { data } = await supabase.auth.getSession()
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
        console.error('Auth boot failed:', e)
        setAuthError(e.message || 'Auth initialization failed')
        // Still set profile to null and allow app to continue
        setProfile(null)
      } finally {
        if (alive) {
          setLoading(false)
          if (timeoutId) clearTimeout(timeoutId)
        }
      }
    }

    // Set a maximum timeout for initial auth load
    timeoutId = setTimeout(() => {
      if (alive) {
        console.warn('Auth boot timeout - forcing loading to false')
        setLoading(false)
        setAuthError('Auth initialization timeout')
      }
    }, 10000) // 10 second max

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
      
      // Set a timeout for auth state changes - CRITICAL to prevent hanging
      authStateChangeTimeout = setTimeout(() => {
        if (alive && !profileFetched) {
          console.warn('Auth state change timeout - forcing loading to false')
          setLoading(false)
          // If we have a session but profile fetch timed out
          if (newSession?.user) {
            console.warn('Profile fetch timed out - clearing session to prevent hang')
            setSession(null)
            setProfile(null)
            setAuthError('Profile fetch timeout - please refresh')
          }
        }
      }, 3000) // 3 second max for state changes
      
      try {
        if (newSession?.user) {
          // Add timeout to ensureProfile call
          const profilePromise = ensureProfile(newSession.user)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile fetch timeout')), 2500)
          )
          
          const prof = await Promise.race([profilePromise, timeoutPromise])
          profileFetched = true
          if (!alive) return
          if (authStateChangeTimeout) {
            clearTimeout(authStateChangeTimeout)
            authStateChangeTimeout = null
          }
          setProfile(prof)
          setAuthError(null)
        } else {
          profileFetched = true
          setProfile(null)
          setAuthError(null)
        }
      } catch (e) {
        profileFetched = true
        console.error('Auth state change failed:', e)
        setAuthError(e.message || 'Auth state change failed')
        setProfile(null)
        // If signout event, clear everything immediately
        if (!newSession) {
          setSession(null)
          setProfile(null)
        }
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

