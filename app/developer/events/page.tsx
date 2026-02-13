'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Event } from '@/lib/supabase/types'

export default function DeveloperEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

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
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (!profile || profile.role !== 'developer') {
      router.push('/')
      return
    }
  }

  async function loadEvents() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })

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
      <div className="mb-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          ← Back
        </Button>
        <h1 className="text-4xl font-bold mb-2">All Events</h1>
        <p className="text-muted-foreground">View and manage all system events</p>
      </div>

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
              <Link href={`/events/${event.id}`}>
                <Button variant="outline" className="w-full">View Event</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
