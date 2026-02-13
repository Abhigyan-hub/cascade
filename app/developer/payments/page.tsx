'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Payment } from '@/lib/supabase/types'

export default function DeveloperPaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
    loadPayments()
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

  async function loadPayments() {
    const { data } = await supabase
      .from('payments')
      .select('*, registration:registrations(*, event:events(*), user:profiles(*))')
      .order('created_at', { ascending: false })

    setPayments(data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          ← Back
        </Button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">All Payments</h1>
            <p className="text-muted-foreground">View all payment transactions</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {payments.map((payment) => {
          const registration = payment.registration as any
          const event = registration?.event
          const user = registration?.user
          return (
            <Card key={payment.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{event?.title || 'Unknown Event'}</CardTitle>
                    <CardDescription>
                      {user?.full_name || user?.email || 'Unknown User'} - {formatDate(payment.created_at)}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge
                      variant={
                        payment.status === 'completed' ? 'accepted' :
                        payment.status === 'failed' ? 'rejected' : 'pending'
                      }
                    >
                      {payment.status}
                    </Badge>
                    <p className="text-lg font-semibold">{formatCurrency(payment.amount || 0)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {payment.razorpay_payment_id && (
                  <div className="text-sm text-muted-foreground">
                    <p>Payment ID: {payment.razorpay_payment_id}</p>
                    <p>Order ID: {payment.razorpay_order_id}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
