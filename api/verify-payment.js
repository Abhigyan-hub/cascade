/**
 * Vercel Serverless Function - Verify Razorpay Payment
 * POST /api/verify-payment
 * Verifies signature and updates payment + registration status via Supabase
 */
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

function verifySignature(orderId, paymentId, signature, secret) {
  const body = `${orderId}|${paymentId}`
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  return expected === signature
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const {
    registration_id,
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
  } = req.body || {}

  if (!registration_id || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({ message: 'Missing payment details' })
  }

  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!razorpaySecret || !supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ message: 'Server configuration error' })
  }

  if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, razorpaySecret)) {
    return res.status(400).json({ message: 'Invalid payment signature' })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { data: payment } = await supabase
      .from('payments')
      .select('id, amount_paise, status')
      .eq('registration_id', registration_id)
      .eq('razorpay_order_id', razorpay_order_id)
      .single()

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' })
    }

    if (payment.status === 'captured') {
      return res.status(200).json({ success: true, message: 'Already verified' })
    }

    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        status: 'captured',
        verified_at: new Date().toISOString(),
      })
      .eq('id', payment.id)

    if (paymentError) {
      console.error('Payment update error:', paymentError)
      return res.status(500).json({ message: 'Failed to update payment' })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Verify payment error:', error)
    return res.status(500).json({ message: 'Verification failed' })
  }
}
