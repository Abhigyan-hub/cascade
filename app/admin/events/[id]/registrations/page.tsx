'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Registration, Event } from '@/lib/supabase/types'

export default function EventRegistrationsPage() {
  const params = useParams()
  const router = useRouter()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkUser()
    loadData()
  }, [params.id])

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

  async function loadData() {
    // Load event
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single()

    setEvent(eventData)

    // Load registrations
    const { data: regData } = await supabase
      .from('registrations')
      .select('*, user:profiles(*)')
      .eq('event_id', params.id)
      .order('created_at', { ascending: false })

    setRegistrations(regData || [])
    setLoading(false)
  }

  async function updateRegistrationStatus(registrationId: string, status: 'accepted' | 'rejected') {
    if (!user) return

    const { error } = await supabase
      .from('registrations')
      .update({ status })
      .eq('id', registrationId)

    if (error) {
      alert('Error updating registration: ' + error.message)
      return
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      admin_id: user.id,
      admin_name: user.full_name || user.email || 'Admin',
      action: status === 'accepted' ? 'approve' : 'reject',
      target_type: 'registration',
      target_id: registrationId,
      details: { event_id: params.id },
    })

    loadData()
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
        <h1 className="text-4xl font-bold mb-2">Registrations</h1>
        <p className="text-muted-foreground">
          {event?.title} - Manage registrations
        </p>
      </div>

      {registrations.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">No registrations yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {registrations.map((registration) => {
            const regUser = registration.user as any
            return (
              <Card key={registration.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{regUser?.full_name || regUser?.email || 'Unknown User'}</CardTitle>
                      <CardDescription>
                        Registered on {formatDate(registration.created_at)}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        registration.status === 'accepted' ? 'accepted' :
                        registration.status === 'rejected' ? 'rejected' : 'pending'
                      }
                    >
                      {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Form Data:</h4>
                      <div className="bg-muted p-4 rounded-md space-y-2">
                        {Object.entries(registration.form_data || {}).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <strong>{key}:</strong> {String(value)}
                          </div>
                        ))}
                      </div>
                    </div>

                    {event?.is_paid && (
                      <div className="text-sm">
                        <strong>Payment Status:</strong>{' '}
                        <Badge
                          variant={
                            registration.payment_status === 'completed' ? 'accepted' :
                            registration.payment_status === 'failed' ? 'rejected' : 'pending'
                          }
                        >
                          {registration.payment_status}
                        </Badge>
                      </div>
                    )}

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
                    </div>
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
