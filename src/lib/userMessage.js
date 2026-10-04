const TECHNICAL =
  /VITE_|DATABASE_URL|JWT_SECRET|RESEND_|MAIL_FROM|RAZORPAY_KEY|API[_ ]?KEY|ECONNREFUSED|ENOTFOUND|ENOENT|postgres|sql\b|nginx|<!DOCTYPE|<html|is not defined|undefined is not|Failed to fetch|NetworkError|Internal Server|EADDRINUSE|AccessDenied|NoSuchBucket|AWS_|S3_|Credential|at\s+\S+\s+\(|SSH to EC2|db:init|WorkingDirectory|stack:|status code|ECONNRESET|ETIMEDOUT|CORS/i

const ALL_CAPS_CODE = /^[A-Z][A-Z0-9_]{5,}$/

export const USER_MESSAGES = {
  generic: 'Something went wrong. Please try again in a moment.',
  network: 'We could not reach CASCADE. Check your internet connection and try again.',
  timeout: 'This is taking longer than usual. Please try again.',
  signIn: 'Please sign in again to continue.',
  forbidden: 'You do not have access to do that.',
  notFound: 'We could not find what you were looking for.',
  server: 'CASCADE is temporarily unavailable. Please try again shortly.',
  payment: 'We could not start payment. Please try again in a few minutes.',
  paymentUnavailable: 'Payments are temporarily unavailable. Please try again later.',
  paymentCancel: 'Payment was cancelled. You can try again when you are ready.',
  paymentFailed: 'Payment did not go through. You have not been charged. You can try again.',
  paymentVerify: 'We could not confirm this payment yet. Check your dashboard — if money was deducted, your registration will update shortly.',
  loadEvents: 'We could not load events right now. Please refresh the page.',
  loadPage: 'This page could not load. Please refresh and try again.',
  signup: 'We could not create your account. Please try again shortly.',
  emailSend: 'We could not send email right now. Please try again shortly.',
  save: 'We could not save your changes. Please try again.',
  delete: 'We could not delete that. Please try again.',
  upload: 'We could not upload those images. Try again with smaller files.',
}

function looksTechnical(text) {
  if (!text) return true
  const s = String(text).trim()
  if (!s || s.length > 180) return true
  if (ALL_CAPS_CODE.test(s)) return true
  if (TECHNICAL.test(s)) return true
  if (s.includes('{') || s.includes('}')) return true
  return false
}

export function toUserMessage(err, fallback = USER_MESSAGES.generic) {
  if (err == null || err === '') return fallback

  if (typeof err === 'string') {
    return looksTechnical(err) ? fallback : err
  }

  const status = err.status
  const raw = String(err.userMessage || err.message || err.data?.message || err.data?.error || '').trim()
  const lower = raw.toLowerCase()

  if (err.code === 'NETWORK' || status === 0) return USER_MESSAGES.network
  if (/failed to fetch|networkerror|load failed|network request failed/.test(lower)) {
    return USER_MESSAGES.network
  }

  if (status === 401) {
    if (!looksTechnical(raw) && /email|password|sign in|session/i.test(raw)) return raw
    return USER_MESSAGES.signIn
  }
  if (status === 403) {
    if (!looksTechnical(raw) && /email|confirm|inbox|password|permission/i.test(raw)) return raw
    return USER_MESSAGES.forbidden
  }
  if (status === 404) {
    if (!looksTechnical(raw)) return raw
    return fallback === USER_MESSAGES.generic ? USER_MESSAGES.notFound : fallback
  }
  if (status === 409 && !looksTechnical(raw)) return raw
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.'
  if (status >= 500) {
    if (!looksTechnical(raw)) return raw
    if (/payment|razorpay|order/i.test(lower) || fallback === USER_MESSAGES.payment) {
      return USER_MESSAGES.paymentUnavailable
    }
    if (/email|mail|verification/i.test(lower)) return USER_MESSAGES.emailSend
    return USER_MESSAGES.server
  }

  if (/cancel/i.test(lower) && /payment/i.test(lower)) return USER_MESSAGES.paymentCancel
  if (!looksTechnical(raw) && (status === 400 || !status)) return raw
  return fallback
}
