import { getApiBase } from './hosts'
import { toUserMessage, USER_MESSAGES } from './userMessage'

export { getApiBase }

const TOKEN_KEY = 'cascade_token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

function readBody(raw) {
  const text = String(raw || '').trim()
  if (!text) return {}
  if (text.startsWith('<') || text.startsWith('<!')) {
    return {}
  }
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) }
  const isForm = options.body instanceof FormData
  if (!isForm && options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${getApiBase()}${path}`, { ...options, headers })
  } catch {
    const err = new Error(USER_MESSAGES.network)
    err.status = 0
    err.code = 'NETWORK'
    throw err
  }

  const raw = await res.text()
  const data = readBody(raw)

  if (!res.ok) {
    const err = new Error(
      toUserMessage(
        { status: res.status, message: data.message || data.error, data },
        USER_MESSAGES.generic
      )
    )
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}
