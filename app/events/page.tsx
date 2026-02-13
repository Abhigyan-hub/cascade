'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Event } from '@/lib/supabase/types'

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true })

    if (error) {
      console.error('Error loading events:', error)
      return
    }

    setEvents(data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">Loading events...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Events</h1>
        <p className="text-muted-foreground">Discover and register for upcoming events</p>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">No events available at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-xl">{event.title}</CardTitle>
                  {event.is_paid && (
                    <Badge variant="accent">{formatCurrency(event.price || 0)}</Badge>
                  )}
                  {!event.is_paid && (
                    <Badge variant="secondary">Free</Badge>
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
                    <strong>Registration Deadline:</strong> {formatDate(event.registration_deadline)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong>Created by:</strong> {event.created_by_name}
                  </div>
                </div>
                <Link href={`/events/${event.id}`}>
                  <Button className="w-full">View Details</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
