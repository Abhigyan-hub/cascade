'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Event } from '@/lib/supabase/types'

export default function AdminEventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvent()
  }, [params.id])

  async function loadEvent() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error loading event:', error)
      router.push('/admin/events')
      return
    }

    setEvent(data)
    setLoading(false)
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
      <div className="mb-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          ← Back
        </Button>
        <h1 className="text-4xl font-bold mb-2">Event Details</h1>
      </div>

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

          <div>
            <h4 className="font-semibold mb-2">Registration Form Fields</h4>
            <div className="space-y-2">
              {event.form_fields && event.form_fields.length > 0 ? (
                event.form_fields.map((field: any, index: number) => (
                  <div key={index} className="bg-muted p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{field.label}</span>
                      <div className="flex gap-2">
                        <Badge variant="outline">{field.type}</Badge>
                        {field.required && <Badge variant="accent">Required</Badge>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No form fields configured</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => router.push(`/admin/events/${event.id}/registrations`)}
              className="flex-1"
            >
              View Registrations
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
