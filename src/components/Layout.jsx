import { Link, Outlet } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Calendar, Shield, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../lib/authContext'

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, profile, signOut } = useAuth()

  const handleSignOut = async () => {
    setMobileMenuOpen(false)
    // Don't await - signOut is now non-blocking
    signOut().catch((err) => {
      console.error('Sign out error (non-blocking):', err)
      // Force navigation as fallback
      window.location.href = '/login'
    })
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'developer'
  const isDeveloper = profile?.role === 'developer'

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-cascade-dark/95 backdrop-blur-lg border-b border-cascade-border">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cascade-purple to-cascade-purple-dark flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white group-hover:text-cascade-purple-light transition-colors">
                CASCADE
              </span>
              <span className="hidden sm:inline text-gray-500 text-sm">Events</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Events
              </Link>
              {user ? (
                <>
                  {profile?.role === 'client' && (
                    <Link
                      to="/dashboard"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Dashboard
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      Admin
                    </Link>
                  )}
                  {isDeveloper && (
                    <Link
                      to="/developer"
                      className="text-cascade-gold hover:text-cascade-gold-light transition-colors flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      Super Admin
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="btn-primary py-2"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4 border-t border-cascade-border"
            >
              <div className="flex flex-col gap-3">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white">
                  Events
                </Link>
                {user ? (
                  <>
                    {profile?.role === 'client' && (
                      <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white">
                        Dashboard
                      </Link>
                    )}
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white">
                        Admin
                      </Link>
                    )}
                    {isDeveloper && (
                      <Link to="/developer" onClick={() => setMobileMenuOpen(false)} className="text-cascade-gold">
                        Super Admin
                      </Link>
                    )}
                    <button onClick={handleSignOut} className="text-left text-gray-400 hover:text-red-400">
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="btn-primary">
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-cascade-surface border-t border-cascade-border py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cascade-purple/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-cascade-purple" />
              </div>
              <span className="font-semibold text-cascade-purple">CASCADE</span>
              <span className="text-gray-500 text-sm">Department of CSE & AI • GHRSTU</span>
            </div>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} CASCADE Events. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
