import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, clearToken, getToken, setToken } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  async function loadSession() {
    const token = getToken()
    if (!token) {
      setUser(null)
      setProfile(null)
      setAuthError(null)
      setLoading(false)
      return
    }
    try {
      const data = await api('/api/auth/me')
      setUser(data.user)
      setProfile(data.profile)
      setAuthError(null)
    } catch (e) {
      if (e.status === 401) {
        clearToken()
        setUser(null)
        setProfile(null)
        setAuthError(null)
      } else {
        setAuthError(e.message || 'Auth error')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSession()
  }, [])

  const value = useMemo(() => {
    return {
      session: user && getToken() ? { user, access_token: getToken() } : null,
      user,
      profile,
      loading,
      authError,
      async applyAuth(data) {
        if (data?.token) setToken(data.token)
        setUser(data.user || data.profile)
        setProfile(data.profile || data.user)
        setAuthError(null)
      },
      async signOut() {
        clearToken()
        setUser(null)
        setProfile(null)
        setLoading(false)
        setAuthError(null)
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      },
      async refreshProfile() {
        setLoading(true)
        await loadSession()
      },
    }
  }, [user, profile, loading, authError])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
