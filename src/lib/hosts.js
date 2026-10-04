/** Production Cascade hosts. Portfolio (www.mozartdev.in) is a separate site. */
export const PRODUCTION_FRONTEND_ORIGIN = 'https://cascade.mozartdev.in'
export const PRODUCTION_API_ORIGIN = 'https://api.cascade.mozartdev.in'
export const PRODUCTION_CHECKOUT_ORIGIN = 'https://www.mozartdev.in'
export const PRODUCTION_CHECKOUT_PATH = '/cascade-pay.html'

function isPublicHttpsOrigin(url) {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    if (parsed.port && parsed.port !== '443') return false
    const host = parsed.hostname
    if (host === 'localhost' || host === '127.0.0.1') return false
    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return false
    return true
  } catch {
    return false
  }
}

export function getApiBase() {
  const fromEnv = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  if (import.meta.env.PROD) {
    if (fromEnv && isPublicHttpsOrigin(fromEnv)) return fromEnv
    return PRODUCTION_API_ORIGIN
  }
  return fromEnv
}

/** Host that may open Razorpay Checkout (dashboard website URL). Empty = this origin. */
export function getRazorpayCheckoutOrigin() {
  const fromEnv = String(import.meta.env.VITE_RAZORPAY_CHECKOUT_ORIGIN || '')
    .trim()
    .replace(/\/$/, '')
  if (fromEnv === 'local' || fromEnv === 'self') return ''
  if (fromEnv && isPublicHttpsOrigin(fromEnv)) return fromEnv
  if (import.meta.env.PROD) return PRODUCTION_CHECKOUT_ORIGIN
  return ''
}

export function getRazorpayCheckoutPath() {
  const fromEnv = String(import.meta.env.VITE_RAZORPAY_CHECKOUT_PATH || '').trim()
  if (fromEnv.startsWith('/')) return fromEnv
  return PRODUCTION_CHECKOUT_PATH
}
