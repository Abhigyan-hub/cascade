import { useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const search = useSearch({ strict: false })
  const from = typeof search?.from === 'string' ? search.from : '/'

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Add timeout to prevent hanging
      const signInPromise = supabase.auth.signInWithPassword({ email, password })
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign in request timed out')), 10000)
      )
      
      const { data, error } = await Promise.race([signInPromise, timeoutPromise])
      
      if (error) {
        // Handle specific error cases
        if (error.message?.includes('rate limit')) {
          toast.error(
            'Too many login attempts. Please wait a few minutes and try again.',
            { duration: 6000 }
          )
          return
        }
        
        if (error.message?.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please check and try again.')
          return
        }
        
        if (error.message?.includes('Email not confirmed')) {
          toast.error(
            'Please confirm your email first. Check your inbox or try signing in anyway if confirmation is disabled.',
            { duration: 8000 }
          )
          // Still try to navigate - some setups allow login without confirmation
          return
        }
        
        toast.error(error.message || 'Sign in failed. Please try again.')
        return
      }
      
      // Success
      if (data?.user) {
        toast.success('Welcome back!')
        navigate({ to: from, replace: true })
      }
    } catch (err) {
      console.error('Sign in error:', err)
      if (err.message?.includes('timeout')) {
        toast.error('Request timed out. Please check your connection and try again.')
      } else {
        toast.error(err.message || 'An error occurred. Please try again.')
      }
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
          <p className="text-gray-500 mt-1">Access your events and registrations</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-cascade"
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
              className="input-cascade"
              placeholder="••••••••"
              required
            />
          </div>
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
