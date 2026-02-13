'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Event } from '@/lib/supabase/types'

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
    loadEvents()
  }, [])

  async function checkUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      router.push('/auth/signin')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (!profile || !['admin', 'developer'].includes(profile.role)) {
      router.push('/')
      return
    }

    setUser(profile)
  }

  async function loadEvents() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    let query = supabase.from('events').select('*')

    // Admins only see their own events, developers see all
    if (profile?.role === 'admin') {
      query = query.eq('created_by', user.id)
    }

    const { data } = await query.order('created_at', { ascending: false })

    setEvents(data || [])
    setLoading(false)
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Manage Events</h1>
          <p className="text-muted-foreground">Create and manage your events</p>
        </div>
        <Link href="/admin/events/create">
          <Button>Create Event</Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground mb-4">No events created yet.</p>
            <Link href="/admin/events/create">
              <Button>Create Your First Event</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-xl">{event.title}</CardTitle>
                  {event.is_paid && (
                    <Badge variant="accent">{formatCurrency(event.price || 0)}</Badge>
                  )}
                </div>
                <CardDescription className="line-clamp-2">
                  {event.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="text-sm text-muted-foreground">
                    <strong>Event Date:</strong> {formatDate(event.event_date)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong>Created by:</strong> {event.created_by_name}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/events/${event.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">Manage</Button>
                  </Link>
                  <Link href={`/admin/events/${event.id}/registrations`} className="flex-1">
                    <Button className="w-full">View Registrations</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
