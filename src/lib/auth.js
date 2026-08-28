import { api, setToken, clearToken } from './api'

export async function signUp(email, password, fullName) {
  try {
    const data = await api('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    })
    setToken(data.token)
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function signIn(email, password) {
  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setToken(data.token)
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function signOut() {
  clearToken()
  try {
    await api('/api/auth/logout', { method: 'POST' })
  } catch {
    // local sign-out is enough
  }
}

export async function getMe() {
  return api('/api/auth/me')
}
