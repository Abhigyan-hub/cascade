'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { User, Registration } from '@/lib/supabase/types'

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [params.id])

  async function loadUser() {
    const { data: userData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', params.id)
      .single()

    setUser(userData)

    const { data: regData } = await supabase
      .from('registrations')
      .select('*, event:events(*)')
      .eq('user_id', params.id)
      .order('created_at', { ascending: false })

    setRegistrations(regData || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">User not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          ← Back
        </Button>
        <h1 className="text-4xl font-bold mb-2">User Profile</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-semibold">{user.full_name || 'No Name'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge
                variant={
                  user.role === 'developer' ? 'accent' :
                  user.role === 'admin' ? 'secondary' : 'default'
                }
              >
                {user.role}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Joined</p>
              <p className="font-semibold">{formatDate(user.created_at)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registration History</CardTitle>
            <CardDescription>{registrations.length} total registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {registrations.slice(0, 5).map((reg) => {
                const event = reg.event as any
                return (
                  <div key={reg.id} className="border-b border-border pb-2 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{event?.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(reg.created_at)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          reg.status === 'accepted' ? 'accepted' :
                          reg.status === 'rejected' ? 'rejected' : 'pending'
                        }
                      >
                        {reg.status}
                      </Badge>
                    </div>
                  </div>
                )
              })}
              {registrations.length > 5 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  +{registrations.length - 5} more
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No registrations found
            </p>
          ) : (
            <div className="space-y-4">
              {registrations.map((reg) => {
                const event = reg.event as any
                return (
                  <Card key={reg.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{event?.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(reg.created_at)}
                          </p>
                          {event?.is_paid && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Amount: {formatCurrency(event.price || 0)}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <Badge
                            variant={
                              reg.status === 'accepted' ? 'accepted' :
                              reg.status === 'rejected' ? 'rejected' : 'pending'
                            }
                          >
                            {reg.status}
                          </Badge>
                          {event?.is_paid && (
                            <Badge
                              variant={
                                reg.payment_status === 'completed' ? 'accepted' :
                                reg.payment_status === 'failed' ? 'rejected' : 'pending'
                              }
                            >
                              Payment: {reg.payment_status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
