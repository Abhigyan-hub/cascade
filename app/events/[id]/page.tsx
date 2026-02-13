'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Event, Registration } from '@/lib/supabase/types'
import RegistrationForm from '@/components/events/RegistrationForm'

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [registration, setRegistration] = useState<Registration | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    checkUser()
    loadEvent()
  }, [params.id])

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

    if (profile) {
      setUser({ ...authUser, ...profile })
      loadRegistration(authUser.id)
    }
  }

  async function loadEvent() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error loading event:', error)
      router.push('/events')
      return
    }

    setEvent(data)
    setLoading(false)
  }

  async function loadRegistration(userId: string) {
    const { data } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', params.id)
      .eq('user_id', userId)
      .single()

    setRegistration(data || null)
  }

  if (loading || !event) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl mb-2">{event.title}</CardTitle>
              <CardDescription className="text-base">
                Created by {event.created_by_name}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {event.is_paid ? (
                <Badge variant="accent" className="text-lg px-4 py-2">
                  {formatCurrency(event.price || 0)}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  Free Event
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-1">Event Date</h4>
              <p className="text-muted-foreground">{formatDate(event.event_date)}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Registration Deadline</h4>
              <p className="text-muted-foreground">{formatDate(event.registration_deadline)}</p>
            </div>
          </div>

          {user && user.role === 'client' && (
            <div className="border-t border-border pt-6">
              {registration ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Your Registration</h3>
                      <Badge
                        variant={
                          registration.status === 'accepted' ? 'accepted' :
                          registration.status === 'rejected' ? 'rejected' : 'pending'
                        }
                      >
                        {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  {event.is_paid && registration.payment_status !== 'completed' && (
                    <Button
                      onClick={() => router.push(`/payments/${registration.id}`)}
                      className="w-full"
                    >
                      Complete Payment
                    </Button>
                  )}
                </div>
              ) : (
                <div>
                  {showForm ? (
                    <RegistrationForm
                      event={event}
                      onSuccess={() => {
                        setShowForm(false)
                        loadRegistration(user.id)
                      }}
                      onCancel={() => setShowForm(false)}
                    />
                  ) : (
                    <Button
                      onClick={() => setShowForm(true)}
                      className="w-full"
                      size="lg"
                    >
                      Register for Event
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
