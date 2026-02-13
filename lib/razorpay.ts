import Razorpay from 'razorpay'

let razorpayInstance: Razorpay | null = null

function getRazorpayInstance(): Razorpay {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
  }
  return razorpayInstance
}

export async function createRazorpayOrder(amount: number, currency: string = 'INR') {
  const options = {
    amount: amount * 100, // Convert to paise
    currency,
    receipt: `receipt_${Date.now()}`,
  }

  const razorpay = getRazorpayInstance()
  const order = await razorpay.orders.create(options)
  return order
}

export function verifyPayment(
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string
): boolean {
  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
  hmac.update(razorpay_order_id + '|' + razorpay_payment_id)
  const generated_signature = hmac.digest('hex')
  return generated_signature === razorpay_signature
}
