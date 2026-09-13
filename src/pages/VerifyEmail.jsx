import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { verifyEmail } from '../lib/auth'
import { useAuth } from '../lib/authContext'
import toast from 'react-hot-toast'
import FormAlert from '../components/FormAlert'

export default function VerifyEmail() {
  const search = useSearch({ strict: false })
  const token = typeof search?.token === 'string' ? search.token : ''
  const navigate = useNavigate()
  const { applyAuth } = useAuth()
  const [status, setStatus] = useState(token ? 'working' : 'missing')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    async function run() {
      const { data, error } = await verifyEmail(token)
      if (cancelled) return
      if (error) {
        setStatus('error')
        setMessage(error.message || 'This confirmation link is invalid or expired.')
        return
      }
      await applyAuth(data)
      setStatus('ok')
      toast.success('Email confirmed')
      setTimeout(() => navigate({ to: '/', replace: true }), 1200)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full max-w-md p-8 text-center"
      >
        <h1 className="text-2xl font-bold text-white mb-4">Confirm email</h1>
        {status === 'working' && <p className="text-gray-400">Confirming your email…</p>}
        {status === 'missing' && (
          <FormAlert type="error" title="Missing link">
            Open the confirmation link from your email.
          </FormAlert>
        )}
        {status === 'error' && (
          <>
            <FormAlert type="error" title="Could not confirm">{message}</FormAlert>
            <Link to="/login" className="btn-primary mt-6 inline-block">
              Back to sign in
            </Link>
          </>
        )}
        {status === 'ok' && (
          <FormAlert type="success" title="Email confirmed">
            You are signed in. Redirecting…
          </FormAlert>
        )}
      </motion.div>
    </div>
  )
}
