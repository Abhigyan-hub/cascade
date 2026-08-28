import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { createRazorpayOrder, openRazorpayCheckoutWithCallback } from '../lib/razorpay'
import toast from 'react-hot-toast'
import { useAuth } from '../lib/authContext'
import { Loader2, CheckCircle2, XCircle, CreditCard, AlertCircle } from 'lucide-react'

export default function Payment() {
  const search = useSearch({ strict: false })
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [event, setEvent] = useState(null)
  const [registration, setRegistration] = useState(null)
  const [payment, setPayment] = useState(null)
  const [orderId, setOrderId] = useState(null)
  const [error, setError] = useState(null)

  const registrationId = search?.registration_id
  const eventId = search?.event_id

  useEffect(() => {
    if (!registrationId || !eventId) {
      setError('Invalid payment link. Missing registration or event ID.')
      setLoading(false)
      return
    }

    async function loadPaymentData() {
      try {
        const ev = await api(`/api/events/${eventId}`)
        setEvent(ev)

        const regData = await api(`/api/registrations/${registrationId}`)
        const reg = { ...regData, status: regData.status }
        setRegistration(reg)

        if (reg.status === 'accepted' || reg.status === 'confirmed') {
          toast.success('Registration already confirmed!')
          navigate({ to: '/dashboard' })
          return
        }

        const pay = regData.payment || regData.payments?.[0] || null
        setPayment(pay)

        if (pay?.razorpay_order_id) {
          setOrderId(pay.razorpay_order_id)
        } else {
          await createOrder(ev)
        }

        setLoading(false)
      } catch (err) {
        console.error('Error loading payment data:', err)
        setError(err.message || 'Failed to load payment information')
        setLoading(false)
      }
    }

    loadPaymentData()
  }, [registrationId, eventId, profile?.id])

  async function createOrder(evOverride) {
    try {
      setError(null)
      const ev = evOverride || event
      const result = await createRazorpayOrder(registrationId, ev?.fee_amount || 0)
      setOrderId(result.orderId)
    } catch (err) {
      console.error('Order creation error:', err)
      const errorMsg = err.message || 'Could not create payment order'
      if (errorMsg.includes('not configured') || errorMsg.includes('gateway') || errorMsg.includes('API keys')) {
        setError('PAYMENT_GATEWAY_NOT_CONFIGURED')
      } else if (err.status === 404) {
        setError('API_ENDPOINT_NOT_FOUND')
      } else if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        setError('Network error. Please check your internet connection and VITE_API_URL setting.')
      } else {
        setError(`Failed to create order: ${errorMsg}`)
      }
    }
  }

  async function handlePayment() {
    if (!orderId || !event || !profile) {
      toast.error('Payment information not ready')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      // Check Razorpay key
      const frontendKey = import.meta.env.VITE_RAZORPAY_KEY_ID
      if (!frontendKey) {
        setError('PAYMENT_GATEWAY_NOT_CONFIGURED')
        setProcessing(false)
        return
      }

      // Use callback URL method - redirects to callback page after payment
      await openRazorpayCheckoutWithCallback({
        orderId,
        amount: event.fee_amount,
        name: profile.full_name || 'CASCADE Events',
        description: event.name,
        email: profile.email,
        registrationId: registrationId,
      })
      
      // Don't set processing to false - we're redirecting to callback page
      // The callback page will handle verification and redirect
    } catch (err) {
      console.error('Payment error:', err)
      setError(err.message || 'Payment failed. Please try again.')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-cascade-purple mx-auto" />
          <p className="text-gray-500">Loading payment information...</p>
        </div>
      </div>
    )
  }

  if (error === 'API_ENDPOINT_NOT_FOUND') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card max-w-md w-full p-8 text-center"
        >
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Payment Error</h1>
          <p className="text-gray-400 mb-6">Unable to create payment order. Please try again.</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate({ to: '/dashboard' })}
              className="btn-secondary"
            >
              Go to Dashboard
            </button>
            <button
              onClick={async () => {
                setError(null)
                setLoading(true)
                await createOrder()
                setLoading(false)
              }}
              className="btn-primary"
            >
              Retry
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (error === 'PAYMENT_GATEWAY_NOT_CONFIGURED') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card max-w-md w-full p-8 text-center"
        >
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Payment Error</h1>
          <p className="text-gray-400 mb-6">Payment gateway is not configured. Please try again later.</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate({ to: '/dashboard' })}
              className="btn-secondary"
            >
              Go to Dashboard
            </button>
            <button
              onClick={async () => {
                setError(null)
                setLoading(true)
                await createOrder()
                setLoading(false)
              }}
              className="btn-primary"
            >
              Retry
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (error && error !== 'PAYMENT_GATEWAY_NOT_CONFIGURED' && error !== 'API_ENDPOINT_NOT_FOUND') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card max-w-md w-full p-8 text-center"
        >
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Payment Error</h1>
          <p className="text-gray-400 mb-6">Unable to process payment. Please try again.</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate({ to: '/dashboard' })}
              className="btn-secondary"
            >
              Go to Dashboard
            </button>
            <button
              onClick={async () => {
                setError(null)
                setLoading(true)
                await createOrder()
                setLoading(false)
              }}
              className="btn-primary"
            >
              Retry
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!event || !registration) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <p className="text-gray-500">Invalid payment information</p>
      </div>
    )
  }

  const amount = event.fee_amount / 100
  const amountDisplay = `₹${amount.toLocaleString('en-IN')}`

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card max-w-md w-full p-8"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-cascade-purple/20 flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-cascade-purple" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Complete Payment</h1>
          <p className="text-gray-400">Event Registration Payment</p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="bg-cascade-surface rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Event:</span>
              <span className="text-white font-medium">{event.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Registration ID:</span>
              <span className="text-white font-mono text-xs">{registration.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Status:</span>
              <span className={`font-medium ${
                registration.status === 'pending' ? 'text-yellow-400' :
                registration.status === 'accepted' ? 'text-green-400' :
                'text-gray-400'
              }`}>
                {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="bg-cascade-purple/10 border border-cascade-purple/30 rounded-lg p-6 text-center">
            <p className="text-gray-400 text-sm mb-2">Amount to Pay</p>
            <p className="text-3xl font-bold text-cascade-purple">{amountDisplay}</p>
          </div>

          {payment?.status === 'captured' && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-green-400 text-sm">Payment already completed</p>
            </div>
          )}
        </div>

        <button
          onClick={handlePayment}
          disabled={processing || !orderId || payment?.status === 'captured'}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : payment?.status === 'captured' ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Payment Completed
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Pay {amountDisplay}
            </>
          )}
        </button>

        <button
          onClick={() => navigate({ to: '/dashboard' })}
          className="btn-secondary w-full mt-3"
        >
          Cancel
        </button>

        {error && error !== 'PAYMENT_GATEWAY_NOT_CONFIGURED' && error !== 'API_ENDPOINT_NOT_FOUND' && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
            <p className="text-red-400 text-sm mb-2">Payment error occurred</p>
            <button
              onClick={async () => {
                setError(null)
                setProcessing(true)
                await createOrder()
                setProcessing(false)
              }}
              className="text-red-300 text-sm underline hover:text-red-200"
            >
              Retry
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
