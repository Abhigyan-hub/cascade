import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { createRazorpayOrder, startRazorpayCheckout } from '../lib/razorpay'
import toast from 'react-hot-toast'
import { useAuth } from '../lib/authContext'
import { toUserMessage, USER_MESSAGES } from '../lib/userMessage'
import { Loader2, CheckCircle2, XCircle, CreditCard } from 'lucide-react'

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
      setError('This payment link is incomplete. Open payment from your dashboard.')
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

        const pay = regData.payment || regData.payments?.[0] || null
        setPayment(pay)

        if (reg.status === 'rejected') {
          setError('This registration was not accepted, so payment is not available.')
          setLoading(false)
          return
        }

        if (pay?.status === 'captured') {
          toast.success('This payment is already complete')
          navigate({ to: '/dashboard' })
          return
        }

        if (pay?.razorpay_order_id) {
          setOrderId(pay.razorpay_order_id)
        } else {
          await createOrder(ev)
        }

        setLoading(false)
      } catch (err) {
        setError(toUserMessage(err, USER_MESSAGES.payment))
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
      setError(toUserMessage(err, USER_MESSAGES.paymentUnavailable))
    }
  }

  async function handlePayment() {
    if (!orderId || !event || !profile) {
      toast.error('Payment is not ready yet. Please wait a moment and try again.')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const frontendKey = import.meta.env.VITE_RAZORPAY_KEY_ID
      if (!frontendKey) {
        setError(USER_MESSAGES.paymentUnavailable)
        setProcessing(false)
        return
      }

      await startRazorpayCheckout({
        orderId,
        amount: event.fee_amount,
        name: profile.full_name || 'CASCADE Events',
        description: event.name,
        email: profile.email,
        registrationId: registrationId,
      })
    } catch (err) {
      setError(toUserMessage(err, USER_MESSAGES.paymentFailed))
      setProcessing(false)
    }
  }

  async function retryOrder() {
    setError(null)
    setLoading(true)
    await createOrder()
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-cascade-purple mx-auto" />
          <p className="text-gray-500">Preparing your payment…</p>
        </div>
      </div>
    )
  }

  if (error && (!event || !registration || !orderId)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card max-w-md w-full p-8 text-center"
        >
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Could not continue to payment</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => navigate({ to: '/dashboard' })} className="btn-secondary">
              Go to dashboard
            </button>
            <button onClick={retryOrder} className="btn-primary">
              Try again
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!event || !registration) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="card max-w-md w-full p-8 text-center">
          <p className="text-gray-400 mb-4">We could not load this payment. Open it again from your dashboard.</p>
          <button onClick={() => navigate({ to: '/dashboard' })} className="btn-primary">
            Go to dashboard
          </button>
        </div>
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
          <h1 className="text-2xl font-bold text-white mb-2">Complete payment</h1>
          <p className="text-gray-400">Event registration</p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="bg-cascade-surface rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm gap-3">
              <span className="text-gray-400">Event</span>
              <span className="text-white font-medium text-right">{event.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Status</span>
              <span
                className={`font-medium ${
                  registration.status === 'pending'
                    ? 'text-yellow-400'
                    : registration.status === 'accepted'
                      ? 'text-green-400'
                      : 'text-gray-400'
                }`}
              >
                {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="bg-cascade-purple/10 border border-cascade-purple/30 rounded-lg p-6 text-center">
            <p className="text-gray-400 text-sm mb-2">Amount to pay</p>
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
          disabled={
            processing ||
            !orderId ||
            payment?.status === 'captured' ||
            registration.status === 'rejected'
          }
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Opening payment…
            </>
          ) : payment?.status === 'captured' ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Payment completed
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Pay {amountDisplay}
            </>
          )}
        </button>

        <button onClick={() => navigate({ to: '/dashboard' })} className="btn-secondary w-full mt-3">
          Cancel
        </button>
        {import.meta.env.PROD ? (
          <p className="text-xs text-gray-500 mt-3 text-center">
            You will complete payment on mozartdev.in, then return here.
          </p>
        ) : null}

        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
            <p className="text-red-300 text-sm mb-2">{error}</p>
            <button
              type="button"
              onClick={async () => {
                setError(null)
                setProcessing(true)
                await createOrder()
                setProcessing(false)
              }}
              className="text-red-200 text-sm underline hover:text-white"
            >
              Try again
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
