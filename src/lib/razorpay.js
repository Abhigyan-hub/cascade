/**
 * Razorpay client-side integration for CASCADE Events
 * Uses Razorpay Checkout for payment collection
 * Amount is in paise (₹100 = 10000 paise)
 */

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
  const response = await fetch('/api/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      registration_id: registrationId,
      amount: amountPaise,
      currency,
    }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to create order')
  }
  return response.json()
}

export async function verifyRazorpayPayment(registrationId, razorpayPaymentId, razorpayOrderId, razorpaySignature) {
  const response = await fetch('/api/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      registration_id: registrationId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_order_id: razorpayOrderId,
      razorpay_signature: razorpaySignature,
    }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || 'Payment verification failed')
  }
  return response.json()
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
      prefill: {
        email: options.email,
        name: options.name,
      },
      theme: {
        color: '#a855f7',
      },
    })
    rzp.on('payment.failed', (response) => {
      reject(new Error(response.error?.description || 'Payment failed'))
    })
    rzp.open()
  })
}
