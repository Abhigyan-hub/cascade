import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function SignUp() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Add timeout to prevent hanging
      const signUpPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: 'client' },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign up request timed out')), 10000)
      )
      
      const { data, error } = await Promise.race([signUpPromise, timeoutPromise])
      
      if (error) {
        // Handle specific error cases
        if (error.message?.includes('rate limit') || error.message?.includes('email rate limit')) {
          toast.error(
            'Email sending rate limit exceeded. Your account may have been created. Please try logging in, or wait a few minutes and try again.',
            { duration: 8000 }
          )
          // Still navigate to login - account might be created
          setTimeout(() => navigate({ to: '/login' }), 2000)
          return
        }
        
        if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
          toast.error('An account with this email already exists. Please sign in instead.')
          navigate({ to: '/login' })
          return
        }
        
        toast.error(error.message || 'Sign up failed. Please try again.')
        return
      }
      
      // Success - account created (email may or may not have been sent)
      if (data?.user) {
        toast.success(
          'Account created! ' + 
          (data.user.email_confirmed_at 
            ? 'You can sign in now.' 
            : 'Please check your email to confirm, or try signing in if email confirmation is disabled.'),
          { duration: 6000 }
        )
        navigate({ to: '/login' })
      } else {
        toast.success('Account creation in progress. Please try signing in.')
        navigate({ to: '/login' })
      }
    } catch (err) {
      console.error('Sign up error:', err)
      if (err.message?.includes('timeout')) {
        toast.error(
          'Request timed out. Your account may have been created. Please try signing in.',
          { duration: 6000 }
        )
        navigate({ to: '/login' })
      } else {
        toast.error(err.message || 'An error occurred. Please try again.')
      }
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
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-cascade"
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
              placeholder="Min 6 characters"
              minLength={6}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
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
