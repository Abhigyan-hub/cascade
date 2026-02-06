import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { openRazorpayCheckout } from '../lib/razorpay'
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
        // Fetch event
        const { data: ev, error: evError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single()

        if (evError || !ev) {
          setError('Event not found')
          setLoading(false)
          return
        }
        setEvent(ev)

        // Fetch registration
        const { data: reg, error: regError } = await supabase
          .from('registrations')
          .select('*')
          .eq('id', registrationId)
          .eq('user_id', profile?.id)
          .single()

        if (regError || !reg) {
          setError('Registration not found or unauthorized')
          setLoading(false)
          return
        }
        setRegistration(reg)

        // Check if already paid
        if (reg.status === 'accepted' || reg.status === 'confirmed') {
          toast.success('Registration already confirmed!')
          navigate({ to: '/dashboard' })
          return
        }

        // Fetch payment record
        const { data: pay, error: payError } = await supabase
          .from('payments')
          .select('*')
          .eq('registration_id', registrationId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (payError && payError.code !== 'PGRST116') {
          console.error('Payment fetch error:', payError)
        }

        setPayment(pay)

        // If payment exists and has order_id, use it
        if (pay?.razorpay_order_id) {
          setOrderId(pay.razorpay_order_id)
        } else {
          // Create new order
          await createOrder()
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

  async function createOrder() {
    try {
      setError(null)
      const apiBase = import.meta.env.VITE_API_URL || window.location.origin
      
      console.log('Creating order with API base:', apiBase)
      
      const createOrderRes = await fetch(`${apiBase}/api/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: registrationId,
          amount: event?.fee_amount || 0,
          currency: 'INR',
        }),
      })

      if (!createOrderRes.ok) {
        const errData = await createOrderRes.json().catch(() => ({}))
        const errorMsg = errData.message || 'Could not create payment order'
        
        console.error('Order creation failed:', {
          status: createOrderRes.status,
          error: errData,
          apiBase,
        })
        
        if (errorMsg.includes('not configured') || errorMsg.includes('gateway')) {
          setError('PAYMENT_GATEWAY_NOT_CONFIGURED')
        } else if (errorMsg.includes('Invalid') || errorMsg.includes('API keys')) {
          setError('PAYMENT_GATEWAY_NOT_CONFIGURED')
        } else {
          setError(`Failed to create order: ${errorMsg}`)
        }
        return
      }

      const { orderId: newOrderId } = await createOrderRes.json()
      console.log('Order created successfully:', newOrderId)
      setOrderId(newOrderId)
    } catch (err) {
      console.error('Order creation error:', err)
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setError('Network error. Please check your internet connection and VITE_API_URL setting.')
      } else {
        setError(err.message || 'Failed to create payment order. Please try again.')
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

      const paymentResponse = await openRazorpayCheckout({
        orderId,
        amount: event.fee_amount,
        name: profile.full_name || 'CASCADE Events',
        description: event.name,
        email: profile.email,
      })

      // Verify payment
      const apiBase = import.meta.env.VITE_API_URL || window.location.origin
      const verifyRes = await fetch(`${apiBase}/api/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: registrationId,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_signature: paymentResponse.razorpay_signature,
        }),
      })

      if (!verifyRes.ok) {
        const errData = await verifyRes.json().catch(() => ({}))
        throw new Error(errData.message || 'Payment verification failed')
      }

      toast.success('Payment successful! Registration confirmed.')
      setTimeout(() => {
        navigate({ to: '/dashboard' })
      }, 1500)
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

  if (error === 'PAYMENT_GATEWAY_NOT_CONFIGURED') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card max-w-2xl w-full p-8"
        >
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <AlertCircle className="w-16 h-16 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Payment Gateway Not Configured</h1>
              <p className="text-gray-400 mb-6">
                Razorpay payment gateway needs to be set up before processing payments.
              </p>
            </div>
            <div className="bg-cascade-surface rounded-lg p-6 text-left space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">Setup Instructions:</h2>
              <div className="space-y-4 text-sm text-gray-300">
                <div>
                  <p className="font-medium text-white mb-2">1. Get Razorpay API Keys:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-400 ml-2">
                    <li>Go to <a href="https://dashboard.razorpay.com" target="_blank" rel="noopener noreferrer" className="text-cascade-purple hover:underline">Razorpay Dashboard</a></li>
                    <li>Navigate to Settings → API Keys</li>
                    <li>Generate Test Key (for development) or Live Key (for production)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-white mb-2">2. Set Environment Variables:</p>
                  <div className="bg-cascade-darker rounded p-4 font-mono text-xs space-y-2">
                    <div>
                      <p className="text-green-400 mb-1"># Frontend (in .env.local or Vercel)</p>
                      <p className="text-gray-300">VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx</p>
                    </div>
                    <div className="mt-3">
                      <p className="text-green-400 mb-1"># Backend (in Vercel Environment Variables only)</p>
                      <p className="text-gray-300">RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx</p>
                      <p className="text-gray-300">RAZORPAY_KEY_SECRET=your_key_secret_here</p>
                    </div>
                    <div className="mt-3">
                      <p className="text-yellow-400 mb-1"># API URL (Optional - only if API is on different domain)</p>
                      <p className="text-gray-300">VITE_API_URL=https://your-vercel-app.vercel.app</p>
                      <p className="text-gray-500 text-xs mt-1">Leave empty if frontend and API are on same domain</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-white mb-2">3. For Vercel Deployment:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-400 ml-2">
                    <li>Go to your Vercel project → Settings → Environment Variables</li>
                    <li>Add all variables above (VITE_RAZORPAY_KEY_ID, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)</li>
                    <li>If your API is on a different domain, add VITE_API_URL</li>
                    <li>Redeploy your application</li>
                  </ul>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 mt-4">
                  <p className="text-yellow-400 text-xs font-medium mb-1">💡 About VITE_API_URL:</p>
                  <p className="text-gray-400 text-xs">
                    Only set this if your API serverless functions are on a different domain than your frontend. 
                    If both are on the same Vercel deployment, leave it empty - it will use the current domain automatically.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate({ to: '/dashboard' })}
                className="btn-secondary"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Retry Payment
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  if (error && error !== 'PAYMENT_GATEWAY_NOT_CONFIGURED') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card max-w-md w-full p-8 text-center"
        >
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Payment Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          {error.includes('create order') && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4 text-left">
              <p className="text-yellow-400 text-xs font-medium mb-1">Troubleshooting:</p>
              <ul className="text-gray-400 text-xs space-y-1 list-disc list-inside">
                <li>Check that Razorpay keys are set in Vercel</li>
                <li>Verify VITE_API_URL is correct (or leave empty if same domain)</li>
                <li>Check browser console for detailed errors</li>
              </ul>
            </div>
          )}
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
              Retry Order Creation
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

        {error && error !== 'PAYMENT_GATEWAY_NOT_CONFIGURED' && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-400 text-sm">{error}</p>
                {error.includes('create order') && (
                  <button
                    onClick={async () => {
                      setError(null)
                      setProcessing(true)
                      await createOrder()
                      setProcessing(false)
                    }}
                    className="text-red-300 text-xs underline mt-2 hover:text-red-200"
                  >
                    Retry creating order
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
