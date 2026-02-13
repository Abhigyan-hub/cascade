'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Script from 'next/script'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Registration, Event, Payment } from '@/lib/supabase/types'

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const [registration, setRegistration] = useState<Registration | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [razorpayKeyId, setRazorpayKeyId] = useState<string>('')

  useEffect(() => {
    loadRazorpayKey()
    loadData()
  }, [params.id])

  async function loadRazorpayKey() {
    const response = await fetch('/api/razorpay/config')
    const { keyId } = await response.json()
    setRazorpayKeyId(keyId || '')
  }

  async function loadData() {
    const { data: regData } = await supabase
      .from('registrations')
      .select('*, event:events(*)')
      .eq('id', params.id)
      .single()

    if (regData) {
      setRegistration(regData)
      setEvent(regData.event as Event)

      // Load payment if exists
      const { data: payData } = await supabase
        .from('payments')
        .select('*')
        .eq('registration_id', params.id)
        .single()

      setPayment(payData || null)
    }

    setLoading(false)
  }

  async function handlePayment() {
    if (!event || !registration) return

    setProcessing(true)

    try {
      // Create payment record
      const { data: paymentData, error: payError } = await supabase
        .from('payments')
        .insert({
          registration_id: registration.id,
          amount: event.price || 0,
          status: 'pending',
        })
        .select()
        .single()

      if (payError) throw payError

      // Create Razorpay order
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: (event.price || 0) * 100, // Convert to paise
          payment_id: paymentData.id,
        }),
      })

      const { order } = await response.json()

      // Initialize Razorpay
      if (!razorpayKeyId) {
        alert('Razorpay is not configured. Please contact support.')
        setProcessing(false)
        return
      }

      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Cascade Forum',
        description: `Payment for ${event.title}`,
        order_id: order.id,
        handler: async function (response: any) {
          // Verify payment
          const verifyResponse = await fetch('/api/razorpay/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              payment_id: paymentData.id,
            }),
          })

          const { success } = await verifyResponse.json()

          if (success) {
            router.push('/my-registrations')
          } else {
            alert('Payment verification failed')
          }
        },
        prefill: {
          email: '',
        },
        theme: {
          color: '#7B2CBF',
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!registration || !event) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">Registration not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <div className="container mx-auto px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Complete Payment</CardTitle>
            <CardDescription>
              Payment for {event.title}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Event:</span>
                <span className="font-semibold">{event.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold text-lg">{formatCurrency(event.price || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Status:</span>
                <Badge
                  variant={
                    payment?.status === 'completed' ? 'accepted' :
                    payment?.status === 'failed' ? 'rejected' : 'pending'
                  }
                >
                  {payment?.status || 'pending'}
                </Badge>
              </div>
            </div>

            {payment?.status !== 'completed' && (
              <Button
                onClick={handlePayment}
                disabled={processing}
                className="w-full"
                size="lg"
              >
                {processing ? 'Processing...' : `Pay ${formatCurrency(event.price || 0)}`}
              </Button>
            )}

            {payment?.status === 'completed' && (
              <div className="p-4 rounded-md bg-accent/10 text-accent text-center">
                Payment completed successfully!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
