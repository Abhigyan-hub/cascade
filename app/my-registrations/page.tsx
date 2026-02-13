'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Registration } from '@/lib/supabase/types'

export default function MyRegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRegistrations()
  }, [])

  async function loadRegistrations() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('registrations')
      .select('*, event:events(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setRegistrations(data || [])
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
        <h1 className="text-4xl font-bold mb-2">My Registrations</h1>
        <p className="text-muted-foreground">View your event registration history</p>
      </div>

      {registrations.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground mb-4">You haven't registered for any events yet.</p>
            <Link href="/events">
              <Button>Browse Events</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {registrations.map((registration) => {
            const event = registration.event as any
            return (
              <Card key={registration.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{event?.title}</CardTitle>
                      <CardDescription>
                        Registered on {formatDate(registration.created_at)}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge
                        variant={
                          registration.status === 'accepted' ? 'accepted' :
                          registration.status === 'rejected' ? 'rejected' : 'pending'
                        }
                      >
                        {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                      </Badge>
                      {event?.is_paid && (
                        <Badge
                          variant={
                            registration.payment_status === 'completed' ? 'accepted' :
                            registration.payment_status === 'failed' ? 'rejected' : 'pending'
                          }
                        >
                          Payment: {registration.payment_status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-muted-foreground">
                      <strong>Event Date:</strong> {event ? formatDate(event.event_date) : 'N/A'}
                    </div>
                    {event?.is_paid && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Amount:</strong> {formatCurrency(event.price || 0)}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/events/${event?.id}`}>
                      <Button variant="outline">View Event</Button>
                    </Link>
                    {event?.is_paid && registration.payment_status !== 'completed' && (
                      <Link href={`/payments/${registration.id}`}>
                        <Button>Complete Payment</Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
