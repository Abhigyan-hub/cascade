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

  // Try read
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (data) return data

  // If missing profile row (common when trigger didn't run), create it client-side.
  // RLS allows insert where auth.uid() = id.
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
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    async function boot() {
      try {
        const { data } = await supabase.auth.getSession()
        if (!alive) return
        setSession(data.session || null)
        if (data.session?.user) {
          const prof = await ensureProfile(data.session.user)
          if (!alive) return
          setProfile(prof)
        } else {
          setProfile(null)
        }
      } catch (e) {
        console.error('Auth boot failed:', e)
      } finally {
        if (alive) setLoading(false)
      }
    }

    boot()

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession || null)
      setLoading(true)
      if (newSession?.user) {
        const prof = await ensureProfile(newSession.user)
        setProfile(prof)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => {
    return {
      session,
      user: session?.user || null,
      profile,
      loading,
      async signOut() {
        // If network fails, still clear local session so UI recovers.
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.warn('Remote signOut failed, clearing local session:', error)
          await supabase.auth.signOut({ scope: 'local' })
        }
      },
      async refreshProfile() {
        if (!session?.user) return
        setLoading(true)
        const prof = await ensureProfile(session.user)
        setProfile(prof)
        setLoading(false)
      },
    }
  }, [session, profile, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

