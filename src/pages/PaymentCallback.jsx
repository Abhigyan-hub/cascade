import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { verifyRazorpayPayment } from '../lib/razorpay'
import toast from 'react-hot-toast'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { toUserMessage, USER_MESSAGES } from '../lib/userMessage'

export default function PaymentCallback() {
  const search = useSearch({ strict: false })
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying') // verifying, success, error
  const [error, setError] = useState(null)

  const registrationId = search?.registration_id
  const razorpayPaymentId = search?.razorpay_payment_id
  const razorpayOrderId = search?.razorpay_order_id || search?.razorpay_orderId
  const razorpaySignature = search?.razorpay_signature
  const paymentStatus = search?.razorpay_payment_status

  useEffect(() => {
    if (!registrationId) {
      setError('This payment page is incomplete. Open payment from your dashboard.')
      setStatus('error')
      return
    }

    async function verifyPayment() {
      try {
        if (paymentStatus === 'failed' || paymentStatus === 'cancelled' || search?.razorpay_payment_status === 'failed') {
          setError(USER_MESSAGES.paymentFailed)
          setStatus('error')
          setTimeout(() => {
            navigate({
              to: '/payment',
              search: { registration_id: registrationId },
            })
          }, 3000)
          return
        }

        if (razorpayPaymentId && razorpayOrderId && razorpaySignature) {
          await verifyRazorpayPayment(registrationId, razorpayPaymentId, razorpayOrderId, razorpaySignature)
          setStatus('success')
          toast.success('Payment successful! Registration confirmed.')
          setTimeout(() => {
            navigate({ to: '/dashboard' })
          }, 2000)
        } else {
          const payment = (await api(`/api/registrations/${registrationId}`)).payment

          if (payment?.status === 'captured' && payment?.razorpay_payment_id) {
            setStatus('success')
            toast.success('Payment successful! Registration confirmed.')
            setTimeout(() => {
              navigate({ to: '/dashboard' })
            }, 2000)
          } else {
            setTimeout(async () => {
              try {
                const updated = (await api(`/api/registrations/${registrationId}`)).payment
                if (updated?.status === 'captured') {
                  setStatus('success')
                  toast.success('Payment successful! Registration confirmed.')
                  setTimeout(() => {
                    navigate({ to: '/dashboard' })
                  }, 2000)
                } else {
                  setError(USER_MESSAGES.paymentVerify)
                  setStatus('error')
                  setTimeout(() => {
                    navigate({ to: '/dashboard' })
                  }, 5000)
                }
              } catch {
                setError(USER_MESSAGES.paymentVerify)
                setStatus('error')
              }
            }, 3000)
          }
        }
      } catch (err) {
        setError(toUserMessage(err, USER_MESSAGES.paymentVerify))
        setStatus('error')
        setTimeout(() => {
          navigate({ to: '/dashboard' })
        }, 5000)
      }
    }

    verifyPayment()
  }, [registrationId, razorpayPaymentId, razorpayOrderId, razorpaySignature, paymentStatus, navigate, search])

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card max-w-md w-full p-8 text-center"
      >
        {status === 'verifying' && (
          <>
            <Loader2 className="w-16 h-16 text-cascade-purple mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-white mb-2">Verifying Payment</h1>
            <p className="text-gray-400">Please wait while we verify your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
            <p className="text-gray-400 mb-4">Your registration has been confirmed.</p>
            <p className="text-gray-500 text-sm">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">We could not confirm payment</h1>
            <p className="text-gray-400 mb-4">{error || USER_MESSAGES.paymentVerify}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate({ to: '/dashboard' })}
                className="btn-secondary"
              >
                Go to Dashboard
              </button>
              {registrationId && (
                <button
                  onClick={() => navigate({ 
                    to: '/payment',
                    search: { registration_id: registrationId }
                  })}
                  className="btn-primary"
                >
                  Try Again
                </button>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
