import { api } from './api'

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(window.Razorpay)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(window.Razorpay)
    document.body.appendChild(script)
  })
}

export async function createRazorpayOrder(registrationId, amountPaise, currency = 'INR') {
  return api('/api/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({
      registration_id: registrationId,
      amount: amountPaise,
      currency,
    }),
  })
}

export async function verifyRazorpayPayment(registrationId, razorpayPaymentId, razorpayOrderId, razorpaySignature) {
  return api('/api/payments/verify', {
    method: 'POST',
    body: JSON.stringify({
      registration_id: registrationId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_order_id: razorpayOrderId,
      razorpay_signature: razorpaySignature,
    }),
  })
}

export async function openRazorpayCheckoutWithCallback(options) {
  const { orderId, amount, name, description, email, registrationId } = options
  const baseUrl = window.location.origin
  const callbackUrl = `${baseUrl}/payment/callback`
  const Razorpay = await loadRazorpayScript()

  return new Promise((resolve, reject) => {
    const rzp = new Razorpay({
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: amount,
      currency: 'INR',
      order_id: orderId,
      name: name || 'CASCADE Events',
      description: description || 'Event Registration',
      prefill: { email, name },
      theme: { color: '#a855f7' },
      handler: function (response) {
        const params = new URLSearchParams({
          registration_id: registrationId,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
          razorpay_payment_status: 'success',
        })
        window.location.href = `${callbackUrl}?${params.toString()}`
        resolve(response)
      },
      modal: {
        ondismiss: function () {
          const params = new URLSearchParams({
            registration_id: registrationId,
            razorpay_payment_status: 'cancelled',
          })
          window.location.href = `${callbackUrl}?${params.toString()}`
          reject(new Error('Payment cancelled by user'))
        },
      },
    })

    rzp.on('payment.failed', function (response) {
      const params = new URLSearchParams({
        registration_id: registrationId,
        razorpay_payment_status: 'failed',
        error: response.error?.description || 'Payment failed',
        razorpay_order_id: orderId,
      })
      window.location.href = `${callbackUrl}?${params.toString()}`
      reject(new Error(response.error?.description || 'Payment failed'))
    })

    rzp.open()
  })
}

export async function openRazorpayCheckout(options) {
  const Razorpay = await loadRazorpayScript()
  return new Promise((resolve, reject) => {
    const rzp = new Razorpay({
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: options.amount,
      currency: options.currency || 'INR',
      order_id: options.orderId,
      name: options.name || 'CASCADE Events',
      description: options.description || 'Event Registration',
      handler: (response) => resolve(response),
      prefill: { email: options.email, name: options.name },
      theme: { color: '#a855f7' },
    })
    rzp.on('payment.failed', (response) => {
      reject(new Error(response.error?.description || 'Payment failed'))
    })
    rzp.open()
  })
}
