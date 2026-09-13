import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { signUp, resendVerification } from '../lib/auth'
import { useAuth } from '../lib/authContext'
import toast from 'react-hot-toast'
import FormAlert from '../components/FormAlert'
import { getCookieConsent, setRememberedUser } from '../lib/preferences'

export default function SignUp() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const navigate = useNavigate()
  const { applyAuth } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')
    setLoading(true)
    try {
      const { data, error } = await signUp(email, password, fullName)
      if (error) {
        if (error.status === 409 || error.message?.includes('already exists')) {
          const message = 'An account with this email already exists. Please sign in instead.'
          setFormError(message)
          toast.error(message)
          navigate({ to: '/login' })
          return
        }
        const message = error.message || 'Sign up failed. Please try again.'
        setFormError(message)
        toast.error(message)
        return
      }
      if (data?.needs_verification || !data?.token) {
        setFormSuccess('We sent a confirmation link to your email. Confirm it before signing in.')
        toast.success('Check your email')
        return
      }
      await applyAuth(data)
      if (getCookieConsent() !== 'declined') {
        setRememberedUser({ email, name: fullName })
      }
      setFormSuccess('Account created.')
      toast.success('Account created!')
      navigate({ to: '/' })
    } catch (err) {
      const message = err.message || 'An error occurred. Please try again.'
      setFormError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full max-w-md p-8"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Create CASCADE account</h2>
          <p className="text-gray-500 mt-1">Register for events and track your bookings</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && <FormAlert type="error" title="Could not create account">{formError}</FormAlert>}
          {formSuccess && (
            <FormAlert type="success" title="Check your email">
              {formSuccess}
            </FormAlert>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`input-cascade ${formError ? 'input-cascade-error' : ''}`}
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`input-cascade ${formError ? 'input-cascade-error' : ''}`}
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
              placeholder="Min 6 characters"
              minLength={6}
              required
            />
          </div>
          <p className="text-xs text-gray-500">
            By signing up you agree to our{' '}
            <Link to="/privacy" className="text-cascade-purple hover:underline">
              privacy policy
            </Link>
            .
          </p>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
          {formSuccess && (
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={async () => {
                const { error } = await resendVerification(email)
                if (error) toast.error(error.message)
                else toast.success('Confirmation email sent again')
              }}
            >
              Resend confirmation email
            </button>
          )}
        </form>
        <p className="mt-6 text-center text-gray-500 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-cascade-purple hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
