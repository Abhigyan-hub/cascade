'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Registration } from '@/lib/supabase/types'

export default function DeveloperRegistrationsPage() {
  const router = useRouter()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
    loadRegistrations()
  }, [])

  async function checkUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      router.push('/auth/signin')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (!profile || profile.role !== 'developer') {
      router.push('/')
      return
    }
  }

  async function loadRegistrations() {
    const { data } = await supabase
      .from('registrations')
      .select('*, event:events(*), user:profiles(*)')
      .order('created_at', { ascending: false })

    setRegistrations(data || [])
    setLoading(false)
  }

  async function updateRegistrationStatus(registrationId: string, status: 'accepted' | 'rejected') {
    const { error } = await supabase
      .from('registrations')
      .update({ status })
      .eq('id', registrationId)

    if (error) {
      alert('Error updating registration: ' + error.message)
      return
    }

    loadRegistrations()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          ← Back
        </Button>
        <h1 className="text-4xl font-bold mb-2">All Registrations</h1>
        <p className="text-muted-foreground">View and manage all registrations</p>
      </div>

      <div className="space-y-4">
        {registrations.map((registration) => {
          const event = registration.event as any
          const user = registration.user as any
          return (
            <Card key={registration.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{event?.title}</CardTitle>
                    <CardDescription>
                      {user?.full_name || user?.email} - {formatDate(registration.created_at)}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      registration.status === 'accepted' ? 'accepted' :
                      registration.status === 'rejected' ? 'rejected' : 'pending'
                    }
                  >
                    {registration.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {registration.status !== 'accepted' && (
                    <Button
                      onClick={() => updateRegistrationStatus(registration.id, 'accepted')}
                      variant="outline"
                      className="flex-1"
                    >
                      Accept
                    </Button>
                  )}
                  {registration.status !== 'rejected' && (
                    <Button
                      onClick={() => updateRegistrationStatus(registration.id, 'rejected')}
                      variant="destructive"
                      className="flex-1"
                    >
                      Reject
                    </Button>
                  )}
                  <Link href={`/events/${event?.id}`}>
                    <Button variant="outline">View Event</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
