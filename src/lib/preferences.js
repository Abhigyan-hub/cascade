const CONSENT_KEY = 'cascade_cookie_consent'
const EMAIL_KEY = 'cascade_remember_email'
const USER_KEY = 'cascade_remember_user'

export function getCookieConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY)
  } catch {
    return null
  }
}

export function setCookieConsent(value) {
  try {
    localStorage.setItem(CONSENT_KEY, value)
    if (value === 'declined') {
      clearRememberedUser()
    }
  } catch {
    /* ignore quota / private mode */
  }
}

export function getRememberedUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.email) return { email: parsed.email, name: parsed.name || '' }
    }
    const email = localStorage.getItem(EMAIL_KEY) || ''
    if (email) return { email, name: '' }
    return null
  } catch {
    return null
  }
}

export function getRememberedEmail() {
  return getRememberedUser()?.email || ''
}

export function setRememberedEmail(email) {
  setRememberedUser({ email, name: getRememberedUser()?.name || '' })
}

export function setRememberedUser({ email, name } = {}) {
  try {
    if (getCookieConsent() === 'declined') {
      clearRememberedUser()
      return
    }
    const trimmed = String(email || '').trim()
    if (!trimmed) {
      clearRememberedUser()
      return
    }
    const user = { email: trimmed, name: String(name || '').trim() }
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    localStorage.setItem(EMAIL_KEY, trimmed)
  } catch {
    /* ignore */
  }
}

export function clearRememberedUser() {
  try {
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(EMAIL_KEY)
  } catch {
    /* ignore */
  }
}
