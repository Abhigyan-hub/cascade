import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { signIn, resendVerification } from '../lib/auth'
import { useAuth } from '../lib/authContext'
import toast from 'react-hot-toast'
import FormAlert from '../components/FormAlert'
import { getCookieConsent, getRememberedUser, setRememberedUser, clearRememberedUser } from '../lib/preferences'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [rememberedName, setRememberedName] = useState('')
  const navigate = useNavigate()
  const { applyAuth } = useAuth()
  const search = useSearch({ strict: false })
  const from = typeof search?.from === 'string' ? search.from : '/'

  useEffect(() => {
    const saved = getRememberedUser()
    if (saved?.email) {
      setEmail(saved.email)
      setRememberedName(saved.name || '')
      setRememberMe(true)
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')
    setLoading(true)
    try {
      const { data, error } = await signIn(email, password)
      if (error) {
        const message = error.message || 'Sign in failed. Please try again.'
        setFormError(message)
        toast.error(message)
        if (error.data?.code === 'UNVERIFIED' || error.status === 403) {
          await resendVerification(email)
        }
        return
      }
      const signedInName = data?.user?.full_name || data?.profile?.full_name || ''
      if (rememberMe && getCookieConsent() !== 'declined') {
        setRememberedUser({ email, name: signedInName })
      } else {
        clearRememberedUser()
      }
      await applyAuth(data)
      setFormSuccess('Signed in. Redirecting…')
      toast.success('Welcome back!')
      navigate({ to: from, replace: true })
    } catch (err) {
      const message = err.message || 'An error occurred. Please try again.'
      setFormError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full max-w-md p-8"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Sign in to CASCADE</h2>
          <p className="text-gray-500 mt-1">
            {rememberedName
              ? `Welcome back, ${rememberedName}`
              : 'Access your events and registrations'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {formError && <FormAlert type="error" title="Could not sign in">{formError}</FormAlert>}
          {formSuccess && <FormAlert type="success" title="Success">{formSuccess}</FormAlert>}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`input-cascade ${formError ? 'input-cascade-error' : formSuccess ? 'input-cascade-success' : ''}`}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`input-cascade ${formError ? 'input-cascade-error' : ''}`}
              placeholder="••••••••"
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-cascade-border bg-cascade-dark text-cascade-purple"
            />
            Remember my email on this device
          </label>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-500 text-sm">
          Don't have an account?{' '}
          <Link to="/signup" className="text-cascade-purple hover:underline">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
