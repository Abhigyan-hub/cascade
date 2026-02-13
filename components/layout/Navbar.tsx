'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { UserRole } from '@/lib/supabase/types'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
    supabase.auth.onAuthStateChange(() => checkUser())
  }, [])

  async function checkUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      setUser(null)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    setUser(profile ? { ...authUser, ...profile } : null)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold gradient-text">Cascade Forum</span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/events">
                  <Button variant="ghost">Events</Button>
                </Link>
                
                {user.role === 'client' && (
                  <Link href="/my-registrations">
                    <Button variant="ghost">My Registrations</Button>
                  </Link>
                )}

                {(user.role === 'admin' || user.role === 'developer') && (
                  <Link href="/admin/events">
                    <Button variant="ghost">Manage Events</Button>
                  </Link>
                )}

                {user.role === 'developer' && (
                  <Link href="/developer/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                )}

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">{user.full_name || user.email}</span>
                  <Button variant="outline" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
